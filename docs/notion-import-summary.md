# Notion → Hishab Import Summary

Date: 2025-11-02  
Source: `notion-finance.zip` (October → early November 2025 workspace export)

## Mapping Overview

- **Accounts** → Dexie `accounts` table (`Account` model)  
  Mapped by name with deterministic ids (`acct-notion-*`). `Account Type` values were normalised into Hishab kinds:
  - Checking / Savings → `bank`
  - bkash → `wallet`
  - Cash → `cash`
    Balances use the Notion “Current Balance” figures (treated as BDT).
- **Expense / Income Categories** → Dexie `categories`  
  Every category from the Notion databases became a category (`cat-expense-*` / `cat-income-*`). Parent relationships were not present in the export, so `parentId` defaults to `null`.
- **Budgets** → Dexie `budgets`  
  Pulled from the “Monthly Budget” column on expense categories for October 2025. Categories without a budget (Loan Payment) were skipped.
- **Transactions** → Dexie `transactions`
  - Expenses → `type: 'expense'`, with account/category relations resolved via the CSV rollups.
  - Incomes → `type: 'income'`.
  - Transfers → `type: 'transfer'` with `accountId` = source, `counterpartyAccountId` = destination.  
    Notes are derived from the Notion page titles with leading date prefixes (e.g. `@November 1, 2025`) stripped. Each row carries an import tag (`notion-import-2025-10`) for traceability.
- **Savings Goals** → Dexie `goals`  
  Target amounts, dates, and current savings copied directly. Dates were normalised to ISO strings.
- **Snapshots** → left empty (no equivalent data in the export).

## Generated Assets

- Conversion script: `scripts/generate_backup_from_notion.py`
- Backup payload: `data-imports/notion-2025-10-backup.json`
  - Accounts: 4
  - Categories: 20 (13 expense, 7 income)
  - Budgets: 12 (total allocation 53,640)
  - Transactions: 155 (117 expense / 8 income / 30 transfer)
  - Goals: 3

## Skipped Rows

Three records were omitted because the export omitted required fields:

| Notion page                           | Reason                   |
| ------------------------------------- | ------------------------ |
| `@October 10, 2025 cash adjustments`  | No category assigned     |
| `@October 23, 2025` (cash adjustment) | No amount provided       |
| `@October 10, 2025 Apu Repay`         | Missing amount & account |

Everything else from the October ledger, budgets, and goals mapped cleanly.

## How to Import

1. Extract `notion-finance.zip` under `notion-finance/`. The script auto-detects the nested `Backend` folder (e.g. `notion-finance/Finance Tracker/Backend`).
2. Regenerate the payload if the source changes: `python3 scripts/generate_backup_from_notion.py`.
3. Launch the app (`pnpm dev`), open **Data Studio → Import JSON**, and select `data-imports/notion-2025-10-backup.json`.
4. Verify the October 2025 dashboard, ledger, budgets, and goals reflect the imported data.

After verifying, optionally back up a fresh copy via **Data Studio → Export JSON**.
