import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import { formatDate, type Lead } from "@/lib/crm";
import type { Note } from "@/lib/notes";
import type { Activity } from "@/lib/activity";

export const APP_NAME = "LeadNest Intern CRM";

const INK = { r: 17, g: 24, b: 39 };
const ACCENT = { r: 13, g: 148, b: 136 };

function safeName(value: string): string {
  const cleaned = value
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return cleaned.slice(0, 48) || "Lead";
}

function value(v?: string | null): string {
  return v && String(v).trim() ? String(v) : "—";
}

function header(doc: jsPDF, subtitle: string) {
  const width = doc.internal.pageSize.getWidth();
  doc.setFillColor(INK.r, INK.g, INK.b);
  doc.rect(0, 0, width, 78, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(APP_NAME, 40, 36);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(190, 200, 210);
  doc.text(subtitle, 40, 56);
  doc.text(`Generated ${new Date().toLocaleString()}`, width - 40, 56, { align: "right" });
  doc.setTextColor(INK.r, INK.g, INK.b);
}

function footer(doc: jsPDF) {
  const pages = doc.getNumberOfPages();
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  for (let i = 1; i <= pages; i += 1) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(130, 140, 150);
    doc.text(`${APP_NAME} — confidential lead report`, 40, height - 24);
    doc.text(`Page ${i} of ${pages}`, width - 40, height - 24, { align: "right" });
  }
}

function section(doc: jsPDF, title: string, rows: [string, string][], startY: number): number {
  autoTable(doc, {
    startY,
    head: [[title, ""]],
    body: rows,
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 6, textColor: [40, 48, 58] },
    headStyles: {
      fillColor: [ACCENT.r, ACCENT.g, ACCENT.b],
      textColor: 255,
      fontStyle: "bold",
      fontSize: 10,
    },
    columnStyles: { 0: { cellWidth: 150, fontStyle: "bold" } },
    margin: { left: 40, right: 40 },
  });
  return (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 18;
}

export function downloadLeadPdf(lead: Lead, notes: Note[] = [], activities: Activity[] = []) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  header(doc, `Lead report · ${lead.lead_id} · ${lead.company_name}`);

  let y = 102;
  y = section(
    doc,
    "Lead Information",
    [
      ["Lead ID", value(lead.lead_id)],
      ["Company Name", value(lead.company_name)],
      ["Contact Person", value(lead.contact_person)],
      ["Email", value(lead.email)],
      ["Phone", value(lead.phone)],
      ["Website", value(lead.website)],
      ["LinkedIn", value(lead.linkedin)],
      ["Location", value(lead.location)],
      ["Industry", value(lead.industry)],
      ["Lead Source", value(lead.lead_source)],
      ["Lead Quality", value(lead.lead_quality)],
      ["Status", value(lead.status)],
      ["Assigned Intern", value(lead.assigned_intern)],
      ["Archived", lead.is_archived ? "Yes" : "No"],
    ],
    y,
  );

  y = section(
    doc,
    "Dates",
    [
      ["Created Date", formatDate(lead.created_date)],
      ["Last Updated", formatDate(lead.last_updated)],
      ["Last Contacted", formatDate(lead.last_contacted)],
      ["Next Follow-up", formatDate(lead.next_follow_up)],
    ],
    y,
  );

  if (notes.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [["Date", "Added by", "Note"]],
      body: notes.map((n) => [formatDate(n.created_date), value(n.created_by), n.note_text]),
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 6, textColor: [40, 48, 58] },
      headStyles: { fillColor: [ACCENT.r, ACCENT.g, ACCENT.b], textColor: 255 },
      columnStyles: { 0: { cellWidth: 80 }, 1: { cellWidth: 110 } },
      margin: { left: 40, right: 40 },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 18;
  }

  if (activities.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [["Date", "Action", "Details"]],
      body: activities
        .slice(0, 25)
        .map((a) => [formatDate(a.created_date), value(a.action), value(a.description)]),
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 6, textColor: [40, 48, 58] },
      headStyles: { fillColor: [ACCENT.r, ACCENT.g, ACCENT.b], textColor: 255 },
      columnStyles: { 0: { cellWidth: 80 }, 1: { cellWidth: 120 } },
      margin: { left: 40, right: 40 },
    });
  }

  footer(doc);
  doc.save(`LeadNest_Lead_${safeName(lead.company_name)}.pdf`);
}

export function downloadAllLeadsPdf(leads: Lead[], scopeLabel: string) {
  const doc = new jsPDF({ unit: "pt", format: "a4", orientation: "landscape" });
  header(doc, `${scopeLabel} · ${leads.length} lead${leads.length === 1 ? "" : "s"}`);

  autoTable(doc, {
    startY: 100,
    head: [
      [
        "Lead ID",
        "Company",
        "Contact",
        "Email",
        "Phone",
        "Website",
        "LinkedIn",
        "Location",
        "Industry",
        "Source",
        "Quality",
        "Status",
        "Intern",
        "Created",
        "Updated",
        "Contacted",
        "Follow-up",
      ],
    ],
    body: leads.map((l) => [
      value(l.lead_id),
      value(l.company_name),
      value(l.contact_person),
      value(l.email),
      value(l.phone),
      value(l.website),
      value(l.linkedin),
      value(l.location),
      value(l.industry),
      value(l.lead_source),
      value(l.lead_quality),
      value(l.status),
      value(l.assigned_intern),
      formatDate(l.created_date),
      formatDate(l.last_updated),
      formatDate(l.last_contacted),
      formatDate(l.next_follow_up),
    ]),
    theme: "striped",
    styles: { fontSize: 6.5, cellPadding: 3, overflow: "linebreak", textColor: [40, 48, 58] },
    headStyles: { fillColor: [ACCENT.r, ACCENT.g, ACCENT.b], textColor: 255, fontSize: 7 },
    margin: { left: 24, right: 24 },
  });

  footer(doc);
  doc.save("LeadNest_All_Leads.pdf");
}
