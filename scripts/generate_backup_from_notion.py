#!/usr/bin/env python3
"""
Convert a Notion finance export (CSV bundle) into a Hishab backup payload.

The script expects the Notion export zip to be unpacked under `notion-finance/`.
It automatically locates the `Backend` directory inside that folder (even if the
export wraps it in another page) and emits a JSON payload compatible with
`importFromJson` so the data can be restored through the Data Studio page.
"""

from __future__ import annotations

import csv
import json
import re
from collections import Counter
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Tuple
import unicodedata

import dateutil.parser

PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_CURRENCY = "BDT"
IMPORT_TAG_PREFIX = "notion-import"

REQUIRED_CSV_FILES = [
    "Accounts 27dafa332ea9811cb674fe2ae259752e_all.csv",
    "Expense Categories 27dafa332ea9815d8feacb7303011bf2_all.csv",
    "Income Categories 27dafa332ea9817495fad2b59c236338_all.csv",
    "Expenses 27dafa332ea981fe9979ef1782b08fcf_all.csv",
    "Incomes 27dafa332ea98179a326ede0adae6664_all.csv",
    "Transfers 27dafa332ea9814dad12eaa099856fa9_all.csv",
    "Savings Goal 27dafa332ea98181b2c6c33c8c9c29a5_all.csv",
]


def now_iso() -> str:
  return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


class ConversionError(RuntimeError):
  """Raised when required source files are missing or invalid."""


def resolve_backend_dir() -> Path:
  root = PROJECT_ROOT / "notion-finance"
  if not root.exists():
    raise ConversionError("Expected Notion export at ./notion-finance, but the folder is missing.")

  candidates: List[Path] = []
  direct_backend = root / "Backend"
  if direct_backend.is_dir():
    candidates.append(direct_backend)
  for candidate in root.glob("**/Backend"):
    if candidate.is_dir():
      candidates.append(candidate)

  seen: Dict[Path, Path] = {}
  for candidate in candidates:
    resolved = candidate.resolve()
    if resolved in seen:
      continue
    seen[resolved] = candidate
    if all((candidate / filename).exists() for filename in REQUIRED_CSV_FILES):
      return candidate

  raise ConversionError(
      "Unable to locate the Notion Backend directory with required CSV exports under ./notion-finance."
  )


def ensure_files_exist(backend_dir: Path) -> None:
  missing = [filename for filename in REQUIRED_CSV_FILES if not (backend_dir / filename).exists()]
  if missing:
    raise ConversionError("Missing Notion CSV exports: {}".format(", ".join(missing)))


def load_csv(path: Path) -> List[Dict[str, str]]:
  with path.open("r", encoding="utf-8-sig") as handle:
    reader = csv.DictReader(handle)
    return [dict(row) for row in reader]


def parse_money(value: str) -> Optional[float]:
  if not value:
    return None
  stripped = value.strip()
  if stripped in {"", "-", "—"}:
    return None
  cleaned = re.sub(r"[^0-9.\-]", "", stripped)
  if cleaned in {"", "-", "."}:
    return None
  return round(float(cleaned), 2)


def parse_date(value: str) -> Optional[datetime]:
  text = (value or "").strip()
  if not text:
    return None
  try:
    return dateutil.parser.parse(text, dayfirst=False)
  except Exception:
    return None


def infer_primary_month(*datasets: List[Dict[str, str]]) -> str:
  counts: Counter[str] = Counter()
  for rows in datasets:
    for row in rows:
      maybe_date = row.get("Date") or row.get("Target Date") or row.get("Start Date")
      parsed = parse_date(maybe_date) if maybe_date else None
      if parsed:
        counts[parsed.strftime("%Y-%m")] += 1
  if counts:
    return counts.most_common(1)[0][0]
  return datetime.now(timezone.utc).strftime("%Y-%m")


def to_iso(date_str: str, fallback_month: Optional[str] = None) -> Optional[str]:
  stripped = (date_str or "").strip()
  if not stripped:
    if fallback_month:
      return f"{fallback_month}-01T00:00:00.000Z"
    return None
  dt = dateutil.parser.parse(stripped, dayfirst=False)  # Notion exports are month-first
  dt = dt.replace(hour=12, minute=0, second=0, microsecond=0)
  if dt.tzinfo is None:
    dt = dt.replace(tzinfo=timezone.utc)
  return dt.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


def slugify(text: str) -> str:
  slug = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
  return slug or "item"


def normalise_text(text: Optional[str]) -> str:
  if not text:
    return ""
  normalized = unicodedata.normalize("NFKD", text)
  ascii_text = normalized.encode("ascii", "ignore").decode("ascii")
  return ascii_text.strip()


DATE_PREFIX_WORDS = {
    "january",
    "february",
    "march",
    "april",
    "may",
    "june",
    "july",
    "august",
    "september",
    "october",
    "november",
    "december",
    "mon",
    "monday",
    "tue",
    "tues",
    "tuesday",
    "wed",
    "wednesday",
    "thu",
    "thur",
    "thurs",
    "thursday",
    "fri",
    "friday",
    "sat",
    "saturday",
    "sun",
    "sunday",
    "today",
    "yesterday",
    "tomorrow",
    "tmrw",
    "last",
    "this",
    "next",
    "week",
    "month",
    "day",
    "year",
}


def strip_transaction_prefix(name: str) -> str:
  text = normalise_text(name)
  if not text:
    return ""
  if text.startswith("@"):
    text = text[1:].strip()
  if not text:
    return ""

  cleaned_tokens: List[str] = []
  for token in text.split():
    normalized = re.sub(r"[^a-z0-9]", "", token.lower())
    if not cleaned_tokens:
      if not normalized:
        continue
      if normalized.isdigit() or re.match(r"^\d+(st|nd|rd|th)$", normalized):
        continue
      if re.match(r"^\d{4}$", normalized):
        continue
      if normalized in DATE_PREFIX_WORDS:
        continue
    cleaned_tokens.append(token)
  return " ".join(cleaned_tokens).strip()


def extract_referenced_name(raw: str) -> str:
  """
  Entries referencing another Notion database follow the pattern:
  `Name (Database/...csv)`. This strips the trailing relation while preserving
  names containing parentheses.
  """
  text = normalise_text(raw or "")
  if not text:
    return ""
  idx = text.rfind(" (")
  if idx != -1 and text[idx:].endswith(".csv)"):
    candidate = text[:idx].strip()
    if candidate:
      return candidate
  return text


def map_account_type(name: str, notion_type: str) -> str:
  normalized_type = notion_type.strip().lower()
  normalized_name = name.strip().lower()
  if "cash" in normalized_name:
    return "cash"
  if "bkash" in normalized_name or "wallet" in normalized_type:
    return "wallet"
  if normalized_type in {"checking", "savings"}:
    return "bank"
  return "bank"


def unique_id(existing: Iterable[str], prefix: str, base: str) -> str:
  candidate = f"{prefix}-{base}"
  suffix = 1
  existing_set = set(existing)
  while candidate in existing_set:
    suffix += 1
    candidate = f"{prefix}-{base}-{suffix}"
  return candidate


@dataclass
class AccountRecord:
  id: str
  name: str
  type: str
  balance: float
  currency: str = DEFAULT_CURRENCY
  archived: bool = False
  createdAt: str = field(default_factory=now_iso)
  updatedAt: str = field(default_factory=now_iso)


@dataclass
class CategoryRecord:
  id: str
  name: str
  type: str  # 'expense' or 'income'
  parentId: Optional[str] = None
  archived: bool = False
  createdAt: str = field(default_factory=now_iso)
  updatedAt: str = field(default_factory=now_iso)


@dataclass
class BudgetRecord:
  id: str
  month: str
  categoryId: str
  amount: float
  spent: float = 0.0
  createdAt: str = field(default_factory=now_iso)
  updatedAt: str = field(default_factory=now_iso)


@dataclass
class TransactionRecord:
  id: str
  date: str
  type: str
  amount: float
  accountId: str
  counterpartyAccountId: Optional[str] = None
  categoryId: Optional[str] = None
  notes: Optional[str] = None
  tags: List[str] = field(default_factory=list)
  createdAt: str = field(default_factory=now_iso)
  updatedAt: str = field(default_factory=now_iso)


@dataclass
class GoalRecord:
  id: str
  name: str
  targetAmount: float
  targetDate: Optional[str]
  currentAllocated: float
  createdAt: str
  updatedAt: str


@dataclass
class ConversionContext:
  target_month: str
  timestamp: str
  import_tag: str


def build_accounts(rows: List[Dict[str, str]]) -> Tuple[List[AccountRecord], Dict[str, str]]:
  records: List[AccountRecord] = []
  mapping: Dict[str, str] = {}
  used_ids: List[str] = []
  for row in rows:
    name = normalise_text(row.get("Name", ""))
    if not name:
      continue
    account_type = map_account_type(name, row.get("Account Type", ""))
    balance = parse_money(row.get("Current Balance", "")) or 0.0
    slug = slugify(name)
    account_id = unique_id(used_ids, "acct-notion", slug)
    used_ids.append(account_id)
    record = AccountRecord(
        id=account_id,
        name=name,
        type=account_type,
        balance=balance,
    )
    records.append(record)
    mapping[name] = account_id
  return records, mapping


def build_categories(rows: List[Dict[str, str]], category_type: str) -> Tuple[List[CategoryRecord], Dict[str, str]]:
  records: List[CategoryRecord] = []
  mapping: Dict[str, str] = {}
  used_ids: List[str] = []
  for row in rows:
    name = normalise_text(row.get("Name", ""))
    if not name:
      continue
    slug = slugify(name)
    category_id = unique_id(used_ids, f"cat-{category_type}", slug)
    used_ids.append(category_id)
    record = CategoryRecord(
        id=category_id,
        name=name,
        type=category_type,
    )
    records.append(record)
    mapping[name] = category_id
  return records, mapping


def derive_budget_amount(row: Dict[str, str]) -> Optional[float]:
  amount = parse_money(row.get("Monthly Budget", ""))
  if amount is None:
    return None
  return amount


def build_budgets(
    expense_rows: List[Dict[str, str]],
    category_map: Dict[str, str],
    month: str,
    timestamp: str,
) -> List[BudgetRecord]:
  budgets: List[BudgetRecord] = []
  used_ids: List[str] = []
  for row in expense_rows:
    name = row.get("Name", "").strip()
    if not name:
      continue
    amount = derive_budget_amount(row)
    if amount is None or amount == 0:
      continue
    category_id = category_map.get(name)
    if not category_id:
      continue
    slug = slugify(name)
    budget_id = unique_id(used_ids, "bdg-notion", slug)
    used_ids.append(budget_id)
    budgets.append(
        BudgetRecord(
            id=budget_id,
            month=month,
            categoryId=category_id,
            amount=amount,
            createdAt=timestamp,
            updatedAt=timestamp,
        )
    )
  return budgets


def normalise_transaction_name(name: str, notes: str) -> Optional[str]:
  cleaned_note = strip_transaction_prefix(notes or "")
  if cleaned_note:
    return cleaned_note
  cleaned_name = strip_transaction_prefix(name or "")
  if cleaned_name:
    return cleaned_name
  fallback = normalise_text(name or notes or "")
  if fallback.startswith("@"):
    fallback = strip_transaction_prefix(fallback)
  return fallback or None


def build_expense_transactions(
    rows: List[Dict[str, str]],
    account_map: Dict[str, str],
    category_map: Dict[str, str],
    context: ConversionContext,
) -> List[TransactionRecord]:
  transactions: List[TransactionRecord] = []
  used_ids: List[str] = []
  for row in rows:
    amount = parse_money(row.get("Amount", ""))
    if amount is None or amount <= 0:
      continue
    account_raw = extract_referenced_name(row.get("Account", ""))
    category_raw = extract_referenced_name(row.get("Category", ""))
    account_id = account_map.get(account_raw)
    category_id = category_map.get(category_raw)
    if not account_id or not category_id:
      continue
    date_iso = to_iso(row.get("Date", ""), context.target_month)
    if not date_iso:
      continue
    slug = slugify(f"{account_raw}-{normalise_text(row.get('Name', ''))}-{row.get('Date', '')}")
    txn_id = unique_id(used_ids, "txn-exp", slug)
    used_ids.append(txn_id)
    note = normalise_transaction_name(row.get("Name", ""), row.get("Notes", ""))
    transactions.append(
        TransactionRecord(
            id=txn_id,
            date=date_iso,
            type="expense",
            amount=amount,
            accountId=account_id,
            categoryId=category_id,
            notes=note,
            tags=[context.import_tag],
            createdAt=date_iso,
            updatedAt=date_iso,
        )
    )
  return transactions


def build_income_transactions(
    rows: List[Dict[str, str]],
    account_map: Dict[str, str],
    category_map: Dict[str, str],
    context: ConversionContext,
) -> List[TransactionRecord]:
  transactions: List[TransactionRecord] = []
  used_ids: List[str] = []
  for row in rows:
    amount = parse_money(row.get("Amount", ""))
    if amount is None or amount <= 0:
      continue
    account_raw = extract_referenced_name(row.get("Account", ""))
    category_raw = extract_referenced_name(row.get("Category ", row.get("Category", "")))
    account_id = account_map.get(account_raw)
    category_id = category_map.get(category_raw)
    if not account_id or not category_id:
      continue
    date_iso = to_iso(row.get("Date", ""), context.target_month)
    if not date_iso:
      continue
    slug = slugify(f"{account_raw}-{normalise_text(row.get('Name', ''))}-{row.get('Date', '')}")
    txn_id = unique_id(used_ids, "txn-inc", slug)
    used_ids.append(txn_id)
    note = normalise_transaction_name(row.get("Name", ""), row.get("Notes", ""))
    transactions.append(
        TransactionRecord(
            id=txn_id,
            date=date_iso,
            type="income",
            amount=amount,
            accountId=account_id,
            categoryId=category_id,
            notes=note,
            tags=[context.import_tag],
            createdAt=date_iso,
            updatedAt=date_iso,
        )
    )
  return transactions


def build_transfer_transactions(
    rows: List[Dict[str, str]],
    account_map: Dict[str, str],
    context: ConversionContext,
) -> List[TransactionRecord]:
  transactions: List[TransactionRecord] = []
  used_ids: List[str] = []
  for row in rows:
    amount = parse_money(row.get("Transfer Amount", ""))
    if amount is None or amount <= 0:
      continue
    from_raw = extract_referenced_name(row.get("From ", row.get("From", "")))
    to_raw = extract_referenced_name(row.get("To", ""))
    from_id = account_map.get(from_raw)
    to_id = account_map.get(to_raw)
    if not from_id or not to_id:
      continue
    date_iso = to_iso(row.get("Date", ""), context.target_month)
    if not date_iso:
      continue
    slug = slugify(f"{from_raw}-{to_raw}-{row.get('Date', '')}")
    txn_id = unique_id(used_ids, "txn-xfer", slug)
    used_ids.append(txn_id)
    note = normalise_transaction_name(row.get("Name", ""), "")
    transactions.append(
        TransactionRecord(
            id=txn_id,
            date=date_iso,
            type="transfer",
            amount=amount,
            accountId=from_id,
            counterpartyAccountId=to_id,
            notes=note,
            categoryId=None,
            tags=[context.import_tag],
            createdAt=date_iso,
            updatedAt=date_iso,
        )
    )
  return transactions


def build_goals(rows: List[Dict[str, str]], context: ConversionContext) -> List[GoalRecord]:
  goals: List[GoalRecord] = []
  used_ids: List[str] = []
  for row in rows:
    name = normalise_text(row.get("Name", ""))
    if not name:
      continue
    target_amount = parse_money(row.get("Target Amount", "")) or 0.0
    current_saved = parse_money(row.get("Current Savings", "")) or 0.0
    target_date = to_iso(row.get("Target Date", "").replace("Goal Achieved!", ""), None)
    start_iso = to_iso(row.get("Start Date", ""), context.target_month) or f"{context.target_month}-01T00:00:00.000Z"
    achieved_flag = row.get("Achieved", "").strip().lower() == "yes"
    slug = slugify(name)
    goal_id = unique_id(used_ids, "goal-notion", slug)
    used_ids.append(goal_id)
    created_at = start_iso
    updated_at = (
        to_iso(row.get("Target Date", ""), context.target_month)
        if achieved_flag and row.get("Target Date")
        else context.timestamp
    )
    goals.append(
        GoalRecord(
            id=goal_id,
            name=name,
            targetAmount=target_amount,
            targetDate=target_date,
            currentAllocated=current_saved,
            createdAt=created_at,
            updatedAt=updated_at,
        )
    )
  return goals


def assemble_backup(backend_dir: Path) -> Tuple[Dict[str, object], ConversionContext]:
  ensure_files_exist(backend_dir)

  accounts_raw = load_csv(backend_dir / "Accounts 27dafa332ea9811cb674fe2ae259752e_all.csv")
  expense_categories_raw = load_csv(
      backend_dir / "Expense Categories 27dafa332ea9815d8feacb7303011bf2_all.csv"
  )
  income_categories_raw = load_csv(
      backend_dir / "Income Categories 27dafa332ea9817495fad2b59c236338_all.csv"
  )
  expenses_raw = load_csv(backend_dir / "Expenses 27dafa332ea981fe9979ef1782b08fcf_all.csv")
  incomes_raw = load_csv(backend_dir / "Incomes 27dafa332ea98179a326ede0adae6664_all.csv")
  transfers_raw = load_csv(backend_dir / "Transfers 27dafa332ea9814dad12eaa099856fa9_all.csv")
  goals_raw = load_csv(backend_dir / "Savings Goal 27dafa332ea98181b2c6c33c8c9c29a5_all.csv")

  target_month = infer_primary_month(expenses_raw, incomes_raw, transfers_raw)
  timestamp = now_iso()
  context = ConversionContext(
      target_month=target_month,
      timestamp=timestamp,
      import_tag=f"{IMPORT_TAG_PREFIX}-{target_month}",
  )

  accounts, account_map = build_accounts(accounts_raw)
  expense_categories, expense_category_map = build_categories(expense_categories_raw, "expense")
  income_categories, income_category_map = build_categories(income_categories_raw, "income")

  budgets = build_budgets(expense_categories_raw, expense_category_map, context.target_month, context.timestamp)

  expenses = build_expense_transactions(expenses_raw, account_map, expense_category_map, context)
  incomes = build_income_transactions(incomes_raw, account_map, income_category_map, context)
  transfers = build_transfer_transactions(transfers_raw, account_map, context)

  transactions = expenses + incomes + transfers
  transactions.sort(key=lambda txn: txn.date)

  goals = build_goals(goals_raw, context)

  payload = {
      "version": 1,
      "exportedAt": timestamp,
      "data": {
          "accounts": [vars(acc) for acc in accounts],
          "categories": [vars(cat) for cat in expense_categories + income_categories],
          "budgets": [vars(budget) for budget in budgets],
          "transactions": [vars(txn) for txn in transactions],
          "goals": [vars(goal) for goal in goals],
          "snapshots": [],
      },
  }
  return payload, context


def main() -> None:
  backend_dir = resolve_backend_dir()
  payload, context = assemble_backup(backend_dir)

  output_dir = PROJECT_ROOT / "data-imports"
  output_dir.mkdir(parents=True, exist_ok=True)
  output_path = output_dir / f"notion-{context.target_month}-backup.json"
  output_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")

  print(f"Backup written to {output_path}")
  counts = {
      "accounts": len(payload["data"]["accounts"]),
      "categories": len(payload["data"]["categories"]),
      "budgets": len(payload["data"]["budgets"]),
      "transactions": len(payload["data"]["transactions"]),
      "goals": len(payload["data"]["goals"]),
  }
  print(
      "Stats -> "
      + ", ".join(f"{label.capitalize()}: {value}" for label, value in counts.items())
      + f", Target Month: {context.target_month}"
  )


if __name__ == "__main__":
  main()
