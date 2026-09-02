# Intern Lead Hub

Build a Simple Intern Lead CRM

Build a simple, beginner-friendly Lead/CRM web application for interns working in a company. The purpose of this application is to help interns collect, organize, track, contact, and follow up with potential business leads.

The application should be clean, modern, responsive, and easy to understand. Do not over-engineer the project. This is an MVP/prototype intended for an internship project and should prioritize simplicity and usability.

1. Main Goal

Create a CRM where interns can:

Add new leads

View all leads

Search and filter leads

Assign leads to interns

Track lead quality and status

Record when a lead was contacted

Schedule the next follow-up

Update lead information

View basic CRM statistics from a dashboard

2. Technology

Use a simple modern web stack that Lovable supports well.

Preferred:

React

TypeScript

Tailwind CSS

Supabase for database and backend

Responsive design for desktop and tablet

Use reusable components

Keep the architecture simple and beginner-friendly.

3. Pages

Create these main pages:

A. Dashboard

The dashboard should provide a quick overview of the CRM.

Display these statistic cards:

Total Leads

New Leads

Contacted Leads

Follow-ups Due

Qualified Leads

Converted Leads

Below the cards, show:

Recent Leads

Upcoming Follow-ups

Leads by Status

Leads by Quality

Use simple charts only where useful. Do not make the dashboard visually complicated.

B. Leads Page

Create a main Leads page containing a table of all leads.

The table should include:

Lead ID

Company Name

Contact Person

Email

Phone

Industry

Location

Lead Quality

Status

Assigned Intern

Last Contacted

Next Follow-up

Actions

Actions:

View

Edit

Delete

Add:

Search bar

Filter button

Add Lead button

Search should work for:

Company name

Contact person

Email

Lead ID

Filters should include:

Lead Quality

Status

Industry

Assigned Intern

Lead Source

4. Add Lead Form

Create a simple form for adding a new lead.

Fields:

Lead Information

Lead ID

Company Name

Contact Person

Email

Phone

Website

LinkedIn

Location

Industry

Lead Source

Lead Quality

Status

Assigned Intern

Created Date

Last Updated

Last Contacted

Next Follow-up

Important behavior

Do NOT make interns manually enter every system field.

Automatically generate:

Lead ID

Created Date

Last Updated

For example:

L001
L002
L003

Lead IDs should be unique.

Default values:

Lead Quality: Cold

Status: New

Created Date: current date

Last Updated: current date

The form should have:

Save Lead

Cancel

Add basic validation:

Company Name is required

Contact Person is required

Email should have valid email format if entered

Phone should accept valid phone numbers

Website and LinkedIn should accept URLs if entered

5. Lead Details Page

When an intern clicks a lead, show a detailed view.

Display the lead information in clear sections.

Company Information

Company Name

Website

LinkedIn

Industry

Location

Contact Information

Contact Person

Email

Phone

Lead Management

Lead ID

Lead Source

Lead Quality

Status

Assigned Intern

Created Date

Last Updated

Last Contacted

Next Follow-up

Add buttons:

Edit Lead

Delete Lead

Mark as Contacted

When clicking Mark as Contacted:

Set Last Contacted to today's date

Update Last Updated

Allow the intern to enter/select the next follow-up date

6. Lead Status

Use these simple statuses:

New

Contacted

Follow-up

Qualified

Converted

Lost

Use visually distinct badges for each status.

The CRM should allow the intern to change the status easily.

Example workflow:

New → Contacted → Follow-up → Qualified → Converted

A lead can also become:

Lost

7. Lead Quality

Use three simple options:

Hot

Warm

Cold

Display them as badges.

Meaning:

Hot

High potential and should be contacted quickly.

Warm

Potential lead but requires further communication.

Cold

Low-priority or early-stage lead.

8. Lead Source

Provide a dropdown with:

LinkedIn

Website

Referral

Email

Phone

Event

Social Media

Other

Allow the user to select the source when creating/editing a lead.

9. Assigned Intern

Create a simple intern assignment system.

Initially create sample interns:

Intern 1

Intern 2

Intern 3

Intern 4

The assigned intern should be selectable from a dropdown.

The CRM should make it possible to filter leads by assigned intern.

Do not build complicated role management for the first version.

10. Follow-up System

Create a simple Follow-ups section/page.

Show:

Today's Follow-ups

Leads whose Next Follow-up date is today.

Upcoming Follow-ups

Leads with follow-up dates in the future.

Overdue Follow-ups

Leads whose follow-up date has passed.

Each follow-up should display:

Company

Contact Person

Phone

Email

Status

Assigned Intern

Next Follow-up

Provide a button:

Mark as Contacted

When clicked:

Update Last Contacted

Update Last Updated

Allow user to select the next follow-up date

11. Database

Use Supabase/PostgreSQL.

Create a simple leads table.

Suggested fields:

id
lead_id
company_name
contact_person
email
phone
website
linkedin
location
industry
lead_source
lead_quality
status
assigned_intern
created_date
last_updated
last_contacted
next_follow_up


Use appropriate data types.

Use timestamps for system timestamps where appropriate.

Lead ID must be unique.

12. CRUD Functionality

The application must have fully working:

Create

Add a new lead.

Read

View leads in the table and details page.

Update

Edit existing lead information.

Delete

Delete a lead after confirmation.

Do not create fake buttons or placeholder functionality.

Every major button should perform the expected action.

13. Dashboard Calculations

The dashboard statistics should come from the actual database.

Calculate:

Total Leads

Number of all leads.

New Leads

Number of leads where Status = New.

Contacted Leads

Number of leads where Status = Contacted.

Follow-ups Due

Number of leads whose Next Follow-up is today or overdue.

Qualified Leads

Number of leads where Status = Qualified.

Converted Leads

Number of leads where Status = Converted.

The dashboard should update when lead data changes.

14. UI/UX

Create a clean professional CRM interface.

Design direction:

Simple

Modern

Minimal

Professional

Beginner-friendly

Easy navigation

Responsive

Use a left sidebar navigation:

Dashboard

Leads

Follow-ups

At the bottom of the sidebar:

Intern Profile

Top bar:

Page title

Search

Simple user/intern indicator

Use cards, tables, badges, dropdowns, modals, and forms where appropriate.

Avoid excessive animations.

15. Navigation

Sidebar:

CRM Logo

Dashboard
Leads
Follow-ups

----------------

Intern Profile
Settings


The CRM name can be:

Pixel AI Intern CRM

Use a simple text/logo treatment rather than creating an overly complex logo.

16. Sample Data

Add realistic sample data so the application is not empty when first opened.

Create approximately 10 sample leads.

Example companies can be fictional, such as:

TechNova Solutions

BrightEdge Systems

CloudMatrix

DataSphere

NextGen Labs

InnovateHub

SmartScale Technologies

VisionStack

AlphaSoft

FutureCore

Use fictional contact names, emails, phone numbers, websites, and LinkedIn values.

Clearly treat these as demo/sample data, not real companies or contacts.

Use different:

Industries

Lead sources

Lead qualities

Statuses

Assigned interns

Follow-up dates

17. Empty States

When there are no leads, show:

No leads found

with a button:

+ Add Your First Lead

When there are no follow-ups:

No follow-ups scheduled

Keep empty states simple and helpful.

18. Error Handling

Add basic user-friendly error handling.

Examples:

Failed to load leads

Failed to create lead

Failed to update lead

Failed to delete lead

Invalid email

Required field missing

Show simple toast notifications for successful actions.

Examples:

Lead added successfully

Lead updated successfully

Lead deleted successfully

Marked as contacted

19. Important MVP Rules

Keep this project intentionally simple.

DO:

Build working CRUD

Use a real database

Make search work

Make filters work

Make dashboard statistics dynamic

Make follow-up tracking work

Make the UI responsive

Use reusable components

Keep the code understandable

DO NOT initially build:

Complex AI features

Email automation

WhatsApp integration

Payment systems

Advanced analytics

Complex permission systems

Multi-company SaaS architecture

Complicated workflow automation

Excessive animations

Unnecessary features

The goal is a simple working CRM MVP for interns.

20. Final Quality Check

Before considering the project complete, verify:

I can add a lead.

The lead gets a unique Lead ID.

The lead appears in the Leads table.

I can search for the lead.

I can filter the lead.

I can open the lead details.

I can edit the lead.

I can delete the lead.

I can assign the lead to an intern.

I can change lead quality.

I can change lead status.

I can set a follow-up date.

Follow-ups appear on the Follow-ups page.

I can mark a lead as contacted.

Last Contacted updates correctly.

Last Updated updates correctly.

Dashboard statistics reflect actual lead data.

The application works on desktop and tablet.

There are no major console errors.

No buttons are merely decorative/placeholders.

Build the application as a functional MVP, not just a UI mockup.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/31ceb787-84d1-4bb6-9c8b-e488549f0164).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
