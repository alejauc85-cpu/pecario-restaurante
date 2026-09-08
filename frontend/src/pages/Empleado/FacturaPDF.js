// src/components/FacturaPDF.js
import React from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";

// Ancho para impresora térmica de 80mm (usa 136 si tu rollo es de 58mm)
const PAGE_WIDTH = 204;
const PAGE_HEIGHT = 1500; // alto "de sobra", el rollo es continuo

const styles = StyleSheet.create({
  page: {
    width: PAGE_WIDTH,
    height: PAGE_HEIGHT,
    padding: 10,
    backgroundColor: "#ffffff",
    fontSize: 8,
    fontFamily: "Helvetica",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 4,
  },
  logo: {
    width: 70,
    height: 35,
    objectFit: "contain",
  },
  header: {
    textAlign: "center",
    marginBottom: 6,
  },
  direccion: {
    fontSize: 7,
    color: "#333",
    textAlign: "center",
    marginBottom: 1,
  },
  telefono: {
    fontSize: 7,
    color: "#333",
    textAlign: "center",
    marginBottom: 4,
  },
  divider: {
    borderBottom: "1px dashed #000",
    marginVertical: 5,
  },
  mesa: {
    fontSize: 10,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 2,
  },
  fecha: {
    fontSize: 7,
    color: "#333",
    textAlign: "center",
    marginBottom: 4,
  },
  columnsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7,
    fontWeight: "bold",
    marginBottom: 3,
  },
  itemBlock: {
    marginBottom: 4,
  },
  itemNombre: {
    fontSize: 8,
    fontWeight: "bold",
  },
  itemDetalle: {
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7,
    marginTop: 1,
  },
  totales: {
    marginTop: 6,
  },
  totalLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 2,
    fontSize: 8,
  },
  propina: {
    fontWeight: "bold",
  },
  totalFinal: {
    fontSize: 11,
    fontWeight: "bold",
    borderTop: "1px solid #000",
    paddingTop: 4,
    marginTop: 3,
  },
  pago: {
    marginTop: 8,
    fontSize: 8,
  },
  pagoLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 1,
  },
  footer: {
    textAlign: "center",
    marginTop: 10,
  },
  footerText: {
    fontSize: 9,
    fontWeight: "bold",
  },
  footerSmall: {
    fontSize: 7,
    color: "#333",
    marginTop: 2,
  },
});

export default function FacturaPDF({
  tableNumber,
  items,
  subtotal,
  propina,
  total,
  valorPagado,
  cambio,
  formaPago,
  logoUrl,
}) {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(value || 0);
  };

  return (
    <Document>
      <Page size={[PAGE_WIDTH, PAGE_HEIGHT]} style={styles.page}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image src={logoUrl} style={styles.logo} />
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.direccion}>Calle Principal #123</Text>
          <Text style={styles.telefono}>Tel: 310-555-1234</Text>
          <View style={styles.divider} />
          <Text style={styles.mesa}>Mesa {tableNumber || "Caja"}</Text>
          <Text style={styles.fecha}>{new Date().toLocaleString()}</Text>
          <View style={styles.divider} />
        </View>

        {/* Items */}
        <View style={styles.columnsHeader}>
          <Text>PRODUCTO</Text>
          <Text>TOTAL</Text>
        </View>

        {items.map((item, index) => (
          <View key={index} style={styles.itemBlock}>
            <Text style={styles.itemNombre}>{item.name}</Text>
            <View style={styles.itemDetalle}>
              <Text>
                {item.qty} x {formatCurrency(item.price)}
              </Text>
              <Text>{formatCurrency(item.price * item.qty)}</Text>
            </View>
          </View>
        ))}

        <View style={styles.divider} />

        {/* Totales */}
        <View style={styles.totales}>
          <View style={styles.totalLine}>
            <Text>SUBTOTAL</Text>
            <Text>{formatCurrency(subtotal)}</Text>
          </View>
          {propina > 0 && (
            <View style={[styles.totalLine, styles.propina]}>
              <Text>PROPINA {propina === subtotal * 0.1 ? "10%" : ""}</Text>
              <Text>{formatCurrency(propina)}</Text>
            </View>
          )}
          <View style={[styles.totalLine, styles.totalFinal]}>
            <Text>TOTAL</Text>
            <Text>{formatCurrency(total)}</Text>
          </View>
        </View>

        {/* Pago */}
        <View style={styles.pago}>
          <View style={styles.divider} />
          <View style={styles.pagoLine}>
            <Text>Forma de pago:</Text>
            <Text>{formaPago}</Text>
          </View>
          <View style={styles.pagoLine}>
            <Text>Valor pagado:</Text>
            <Text>{formatCurrency(valorPagado)}</Text>
          </View>
          {cambio > 0 && (
            <View style={styles.pagoLine}>
              <Text>Cambio:</Text>
              <Text>{formatCurrency(cambio)}</Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.divider} />
          <Text style={styles.footerText}>¡Gracias por su visita!</Text>
          <Text style={styles.footerSmall}>Vuelva pronto</Text>
        </View>
      </Page>
    </Document>
  );
}