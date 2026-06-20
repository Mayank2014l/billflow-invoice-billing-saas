import React from "react";
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";

interface InvoicePDFInput {
  number: string;
  issueDate: Date | string;
  dueDate: Date | string;
  subtotal: number;
  taxAmount: number;
  discount: number;
  total: number;
  notes?: string | null;
  terms?: string | null;
  templateId: string;
  organization: {
    name: string;
    logo?: string | null;
    address?: string | null;
    taxName: string;
    taxNumber?: string | null;
    currency: string;
  };
  client: {
    name: string;
    email: string;
    address?: string | null;
    taxNumber?: string | null;
  };
  items: {
    description: string;
    quantity: number;
    rate: number;
    amount: number;
    taxRate: number;
  }[];
}

const formatDate = (date: Date | string) => {
  const d = new Date(date);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export async function generateInvoicePDF(data: InvoicePDFInput): Promise<Buffer> {
  const template = data.templateId || "modern";
  
  // Pick layout styles based on template
  const currentStyles = styles[template as keyof typeof styles] || styles.modern;
  const fontMain = template === "classic" ? "Times-Roman" : "Helvetica";
  const fontBold = template === "classic" ? "Times-Bold" : "Helvetica-Bold";

  const doc = (
    <Document>
      <Page size="A4" style={[currentStyles.page, { fontFamily: fontMain }]}>
        {/* Header Section */}
        <View style={currentStyles.headerContainer}>
          <View>
            <Text style={[currentStyles.orgName, { fontFamily: fontBold }]}>
              {data.organization.name}
            </Text>
            {data.organization.address && (
              <Text style={currentStyles.addressText}>{data.organization.address}</Text>
            )}
            {data.organization.taxNumber && (
              <Text style={currentStyles.addressText}>
                {data.organization.taxName}: {data.organization.taxNumber}
              </Text>
            )}
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={[currentStyles.invoiceTitle, { fontFamily: fontBold }]}>INVOICE</Text>
            <Text style={currentStyles.metaLabel}>Invoice #: {data.number}</Text>
            <Text style={currentStyles.metaLabel}>Date: {formatDate(data.issueDate)}</Text>
            <Text style={currentStyles.metaLabel}>Due: {formatDate(data.dueDate)}</Text>
          </View>
        </View>

        {/* Bill To Section */}
        <View style={currentStyles.billToContainer}>
          <Text style={[currentStyles.sectionTitle, { fontFamily: fontBold }]}>BILL TO</Text>
          <Text style={[currentStyles.clientName, { fontFamily: fontBold }]}>
            {data.client.name}
          </Text>
          <Text style={currentStyles.clientEmail}>{data.client.email}</Text>
          {data.client.address && (
            <Text style={currentStyles.addressText}>{data.client.address}</Text>
          )}
          {data.client.taxNumber && (
            <Text style={currentStyles.addressText}>Tax ID: {data.client.taxNumber}</Text>
          )}
        </View>

        {/* Items Table */}
        <View style={currentStyles.table}>
          {/* Table Header */}
          <View style={currentStyles.tableRowHeader}>
            <View style={{ flex: 4 }}>
              <Text style={[currentStyles.tableHeaderCell, { fontFamily: fontBold }]}>
                Description
              </Text>
            </View>
            <View style={{ flex: 1, alignItems: "flex-end" }}>
              <Text style={[currentStyles.tableHeaderCell, { fontFamily: fontBold }]}>Qty</Text>
            </View>
            <View style={{ flex: 1.5, alignItems: "flex-end" }}>
              <Text style={[currentStyles.tableHeaderCell, { fontFamily: fontBold }]}>Rate</Text>
            </View>
            <View style={{ flex: 1.2, alignItems: "flex-end" }}>
              <Text style={[currentStyles.tableHeaderCell, { fontFamily: fontBold }]}>Tax</Text>
            </View>
            <View style={{ flex: 1.8, alignItems: "flex-end" }}>
              <Text style={[currentStyles.tableHeaderCell, { fontFamily: fontBold }]}>Amount</Text>
            </View>
          </View>

          {/* Table Rows */}
          {data.items.map((item, idx) => (
            <View key={idx} style={currentStyles.tableRow}>
              <View style={{ flex: 4 }}>
                <Text style={currentStyles.tableCell}>{item.description}</Text>
              </View>
              <View style={{ flex: 1, alignItems: "flex-end" }}>
                <Text style={currentStyles.tableCell}>{item.quantity}</Text>
              </View>
              <View style={{ flex: 1.5, alignItems: "flex-end" }}>
                <Text style={currentStyles.tableCell}>
                  {data.organization.currency} {item.rate.toFixed(2)}
                </Text>
              </View>
              <View style={{ flex: 1.2, alignItems: "flex-end" }}>
                <Text style={currentStyles.tableCell}>{item.taxRate}%</Text>
              </View>
              <View style={{ flex: 1.8, alignItems: "flex-end" }}>
                <Text style={currentStyles.tableCell}>
                  {data.organization.currency} {item.amount.toFixed(2)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Totals Section */}
        <View style={currentStyles.summaryContainer}>
          <View style={{ flex: 1 }} />
          <View style={{ width: 220 }}>
            <View style={currentStyles.summaryRow}>
              <Text style={currentStyles.summaryLabel}>Subtotal:</Text>
              <Text style={currentStyles.summaryValue}>
                {data.organization.currency} {data.subtotal.toFixed(2)}
              </Text>
            </View>
            {data.discount > 0 && (
              <View style={currentStyles.summaryRow}>
                <Text style={currentStyles.summaryLabel}>Discount:</Text>
                <Text style={currentStyles.summaryValue}>
                  -{data.organization.currency} {data.discount.toFixed(2)}
                </Text>
              </View>
            )}
            {data.taxAmount > 0 && (
              <View style={currentStyles.summaryRow}>
                <Text style={currentStyles.summaryLabel}>Tax ({data.organization.taxName}):</Text>
                <Text style={currentStyles.summaryValue}>
                  {data.organization.currency} {data.taxAmount.toFixed(2)}
                </Text>
              </View>
            )}
            <View style={[currentStyles.summaryRow, currentStyles.totalRow]}>
              <Text style={[currentStyles.totalLabel, { fontFamily: fontBold }]}>Total:</Text>
              <Text style={[currentStyles.totalValue, { fontFamily: fontBold }]}>
                {data.organization.currency} {data.total.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Notes & Terms */}
        <View style={currentStyles.footerNotes}>
          {data.notes && (
            <View style={{ marginBottom: 10 }}>
              <Text style={[currentStyles.notesHeading, { fontFamily: fontBold }]}>Notes</Text>
              <Text style={currentStyles.notesText}>{data.notes}</Text>
            </View>
          )}
          {data.terms && (
            <View>
              <Text style={[currentStyles.notesHeading, { fontFamily: fontBold }]}>
                Terms & Conditions
              </Text>
              <Text style={currentStyles.notesText}>{data.terms}</Text>
            </View>
          )}
        </View>

        {/* Brand Footer */}
        <View style={currentStyles.brandFooter}>
          <Text>Powered by BillFlow (www.billflowsaas.com)</Text>
        </View>
      </Page>
    </Document>
  );

  return (await renderToBuffer(doc)) as Buffer;
}

// Layout definition for the three templates
const styles = {
  modern: StyleSheet.create({
    page: {
      padding: 40,
      fontSize: 10,
      color: "#374151",
      lineHeight: 1.5,
    },
    headerContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      borderBottomWidth: 2,
      borderBottomColor: "#7c3aed",
      paddingBottom: 20,
      marginBottom: 30,
    },
    orgName: {
      fontSize: 18,
      color: "#111827",
    },
    invoiceTitle: {
      fontSize: 24,
      color: "#7c3aed",
      marginBottom: 5,
    },
    addressText: {
      fontSize: 9,
      color: "#6b7280",
      marginTop: 2,
    },
    metaLabel: {
      fontSize: 9,
      color: "#4b5563",
      marginTop: 2,
    },
    billToContainer: {
      marginBottom: 30,
    },
    sectionTitle: {
      fontSize: 9,
      color: "#7c3aed",
      letterSpacing: 0.5,
      marginBottom: 5,
    },
    clientName: {
      fontSize: 12,
      color: "#111827",
    },
    clientEmail: {
      fontSize: 9,
      color: "#4b5563",
      marginBottom: 3,
    },
    table: {
      width: "100%",
      marginBottom: 20,
    },
    tableRowHeader: {
      flexDirection: "row",
      backgroundColor: "#f5f3ff",
      borderBottomWidth: 1,
      borderBottomColor: "#ddd",
      padding: 6,
    },
    tableHeaderCell: {
      fontSize: 9,
      color: "#4c1d95",
    },
    tableRow: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: "#f3f4f6",
      padding: 8,
    },
    tableCell: {
      fontSize: 9.5,
    },
    summaryContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 35,
    },
    summaryRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 3,
    },
    summaryLabel: {
      fontSize: 9,
      color: "#6b7280",
    },
    summaryValue: {
      fontSize: 9,
      color: "#374151",
    },
    totalRow: {
      borderTopWidth: 1,
      borderTopColor: "#e5e7eb",
      paddingTop: 6,
      marginTop: 4,
    },
    totalLabel: {
      fontSize: 12,
      color: "#111827",
    },
    totalValue: {
      fontSize: 12,
      color: "#7c3aed",
    },
    footerNotes: {
      borderTopWidth: 1,
      borderTopColor: "#f3f4f6",
      paddingTop: 15,
      marginTop: 20,
    },
    notesHeading: {
      fontSize: 8,
      color: "#4b5563",
      textTransform: "uppercase",
      marginBottom: 3,
    },
    notesText: {
      fontSize: 8.5,
      color: "#6b7280",
    },
    brandFooter: {
      position: "absolute",
      bottom: 20,
      left: 40,
      right: 40,
      textAlign: "center",
      color: "#9ca3af",
      fontSize: 8,
      borderTopWidth: 1,
      borderTopColor: "#f3f4f6",
      paddingTop: 10,
    },
  }),
  classic: StyleSheet.create({
    page: {
      padding: 45,
      fontSize: 10.5,
      color: "#222",
      lineHeight: 1.4,
    },
    headerContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      borderBottomWidth: 1,
      borderBottomColor: "#111",
      paddingBottom: 15,
      marginBottom: 25,
    },
    orgName: {
      fontSize: 20,
      color: "#111",
    },
    invoiceTitle: {
      fontSize: 22,
      color: "#111",
      marginBottom: 5,
    },
    addressText: {
      fontSize: 9,
      color: "#444",
      marginTop: 2,
    },
    metaLabel: {
      fontSize: 9,
      color: "#444",
      marginTop: 2,
    },
    billToContainer: {
      marginBottom: 25,
      borderWidth: 1,
      borderColor: "#ddd",
      padding: 10,
    },
    sectionTitle: {
      fontSize: 8.5,
      color: "#333",
      letterSpacing: 0.5,
      marginBottom: 4,
    },
    clientName: {
      fontSize: 12,
      color: "#111",
    },
    clientEmail: {
      fontSize: 9,
      color: "#555",
      marginBottom: 2,
    },
    table: {
      width: "100%",
      borderWidth: 1,
      borderColor: "#111",
      marginBottom: 20,
    },
    tableRowHeader: {
      flexDirection: "row",
      backgroundColor: "#eaeaea",
      borderBottomWidth: 1,
      borderBottomColor: "#111",
      padding: 5,
    },
    tableHeaderCell: {
      fontSize: 9,
      color: "#111",
    },
    tableRow: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: "#ddd",
      padding: 6,
    },
    tableCell: {
      fontSize: 9.5,
    },
    summaryContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 30,
    },
    summaryRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 2,
    },
    summaryLabel: {
      fontSize: 9.5,
      color: "#333",
    },
    summaryValue: {
      fontSize: 9.5,
      color: "#111",
    },
    totalRow: {
      borderTopWidth: 1.5,
      borderTopColor: "#111",
      paddingTop: 5,
      marginTop: 3,
    },
    totalLabel: {
      fontSize: 11,
      color: "#111",
    },
    totalValue: {
      fontSize: 11,
      color: "#111",
    },
    footerNotes: {
      paddingTop: 10,
      marginTop: 15,
    },
    notesHeading: {
      fontSize: 8.5,
      color: "#333",
      marginBottom: 3,
    },
    notesText: {
      fontSize: 8.5,
      color: "#555",
    },
    brandFooter: {
      position: "absolute",
      bottom: 25,
      left: 45,
      right: 45,
      textAlign: "center",
      color: "#777",
      fontSize: 8,
      borderTopWidth: 1,
      borderTopColor: "#eee",
      paddingTop: 8,
    },
  }),
  minimal: StyleSheet.create({
    page: {
      padding: 35,
      fontSize: 9.5,
      color: "#000",
      lineHeight: 1.6,
    },
    headerContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingBottom: 30,
      marginBottom: 20,
    },
    orgName: {
      fontSize: 16,
      color: "#000",
    },
    invoiceTitle: {
      fontSize: 18,
      color: "#000",
      letterSpacing: 1,
      marginBottom: 5,
    },
    addressText: {
      fontSize: 8.5,
      color: "#555",
      marginTop: 2,
    },
    metaLabel: {
      fontSize: 8.5,
      color: "#555",
      marginTop: 2,
    },
    billToContainer: {
      marginBottom: 30,
    },
    sectionTitle: {
      fontSize: 8,
      color: "#777",
      letterSpacing: 0.5,
      marginBottom: 3,
      textTransform: "uppercase",
    },
    clientName: {
      fontSize: 11,
      color: "#000",
    },
    clientEmail: {
      fontSize: 8.5,
      color: "#555",
      marginBottom: 2,
    },
    table: {
      width: "100%",
      marginBottom: 25,
    },
    tableRowHeader: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: "#000",
      paddingBottom: 5,
      paddingHorizontal: 2,
    },
    tableHeaderCell: {
      fontSize: 8.5,
      color: "#000",
      textTransform: "uppercase",
    },
    tableRow: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: "#eee",
      paddingVertical: 7,
      paddingHorizontal: 2,
    },
    tableCell: {
      fontSize: 9,
    },
    summaryContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 25,
    },
    summaryRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 3,
    },
    summaryLabel: {
      fontSize: 8.5,
      color: "#555",
    },
    summaryValue: {
      fontSize: 8.5,
      color: "#000",
    },
    totalRow: {
      borderTopWidth: 1,
      borderTopColor: "#000",
      paddingTop: 5,
      marginTop: 3,
    },
    totalLabel: {
      fontSize: 10,
      color: "#000",
      textTransform: "uppercase",
    },
    totalValue: {
      fontSize: 10,
      color: "#000",
    },
    footerNotes: {
      marginTop: 15,
    },
    notesHeading: {
      fontSize: 8,
      color: "#555",
      textTransform: "uppercase",
      marginBottom: 2,
    },
    notesText: {
      fontSize: 8,
      color: "#666",
    },
    brandFooter: {
      position: "absolute",
      bottom: 20,
      left: 35,
      right: 35,
      textAlign: "left",
      color: "#999",
      fontSize: 7.5,
      borderTopWidth: 1,
      borderTopColor: "#eee",
      paddingTop: 10,
    },
  }),
};
