# Pesticide Manager and Calculator Specification

## Goal

Build a smartphone-first web app for pesticide dilution calculation and usage record management.

## Tech

- React 19
- TypeScript
- Vite
- Pure CSS
- localStorage
- No external UI library
- Web app first
- Structured to be easy to evolve into a PWA later

## Screens

Top navigation:

- Calculate
- Pesticides
- Usage Records

## Data Types

### Pesticide

- id: string
- name: string
- group: string
- pests: string[]
- dilution?: number
- usagePer10a?: number
- usageUnit?: "mL" | "g"
- liquidPer10a?: number
- note?: string
- isDefault?: boolean

### PesticideUsageRecord

- id: string
- date: string
- fieldName: string
- cropName?: string
- pesticideId?: string
- pesticideName: string
- dilution?: number
- liquidAmount?: number
- liquidUnit?: "L" | "mL"
- chemicalAmount?: number
- chemicalUnit?: "mL" | "g"
- areaA?: number
- targetPests?: string[]
- note?: string
- createdAt: string
- updatedAt: string

## localStorage Keys

- registeredPesticides
- pesticideUsageRecords

## Initial Data

- Define default data in `src/data/defaultPesticides.ts`
- Keep the first version around 10 records
- Structure should be easy to extend later
- If `registeredPesticides` does not exist or is an empty array, restore default data

## Calculator

- Pesticide selector at the top
- On pesticide selection, auto-fill dilution, usage per 10a, usage unit, and spray liquid per 10a
- Dilution remains editable
- Show 3 calculation cards on one screen

### Card 1: Calculate Chemical Amount From Spray Volume

Inputs:

- spray liquid amount
- unit L/mL
- dilution

Output:

- required chemical amount in mL

Formula:

- spray liquid mL = input in L ? value * 1000 : value
- required chemical mL = spray liquid mL / dilution

### Card 2: Calculate Spray Volume From Chemical Amount

Inputs:

- chemical amount
- unit mL/g/L/kg
- dilution

Outputs:

- spray liquid amount in L/mL
- water amount in L/mL

Formula:

- chemical mL = input in mL ? value : input in L ? value * 1000 : value
- spray liquid mL = chemical mL * dilution
- water mL = spray liquid mL - chemical mL

Note:

- For g/kg, keep the entered unit in the UI but perform the numeric calculation without density conversion

### Card 3: Calculate Spray Volume and Chemical Amount From Area

Inputs:

- area in a
- spray liquid per 10a in L
- chemical amount per 10a
- chemical unit mL/g

Outputs:

- required spray liquid in L/mL
- required chemical amount in mL/g

Formula:

- required spray liquid L = spray liquid per 10a L * area a / 10
- required chemical amount = chemical per 10a * area a / 10

## Formatting

- If mL is 1000 or more, display like `1 L 500 mL`
- Decimals up to 2 digits
- Hide results when input is invalid or missing

## Pesticide List

- Card list of registered pesticides
- Filter by pest name
- Search by pesticide name
- Show:
  - name
  - group
  - target pests
  - dilution
  - usage per 10a
  - spray liquid per 10a
  - note
- Add new pesticide
- Edit pesticide
- Delete pesticide with confirm
- Default data can also be deleted
- If all are deleted, restore defaults on next load

## Usage Records

- Add record
- List records
- Edit record
- Delete record
- Search and filter by date, field name, crop name, and pesticide name

### New Record Form

Inputs:

- date required
- fieldName required
- cropName optional
- pesticideId optional
- pesticideName required
- dilution optional
- liquidAmount optional
- liquidUnit L/mL
- chemicalAmount optional
- chemicalUnit mL/g
- areaA optional
- targetPests optional, multiple
- note optional

On pesticide selection, auto-fill:

- pesticideId
- pesticideName
- dilution
- targetPests

### Record List

- Newest date first
- Card format
- Show:
  - date
  - field name
  - crop name
  - pesticide name
  - dilution
  - spray liquid amount
  - chemical amount
  - area
  - target pests
  - note
- Edit button
- Delete button

### Storage

- Save records in localStorage key `pesticideUsageRecords`
- Store `createdAt` and `updatedAt`
- Update `updatedAt` on edit

## UI

- White, pale green, and deep green base colors
- Card layout
- One-column smartphone-first layout
- Two-column layout where useful on larger screens
- Inputs and buttons at least 44px high
- Large and readable result display
- Easy to use on iPhone Safari and Android Chrome
- Avoid unnecessary decoration

## Reset

- A reset action on calculator screen
- Search conditions can also be reset
- Do not delete pesticide data or usage records

## Notice

Always display:

`実際の使用前に必ず製品ラベル・登録内容を確認してください。`
