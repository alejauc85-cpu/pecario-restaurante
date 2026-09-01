// src/components/FacturaPDF.js
import React from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: '#ffffff',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  logo: {
    width: 120,
    height: 60,
    objectFit: 'contain',
  },
  header: {
    textAlign: 'center',
    marginBottom: 15,
  },
  direccion: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    marginBottom: 2,
  },
  telefono: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    marginBottom: 5,
  },
  divider: {
    borderBottom: '1px solid #ccc',
    marginVertical: 8,
  },
  mesa: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  fecha: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  columns: {
    flexDirection: 'row',
    borderBottom: '1px solid #ccc',
    paddingBottom: 5,
    marginBottom: 5,
    fontSize: 10,
    fontWeight: 'bold',
  },
  colItem: { flex: 2 },
  colCant: { flex: 0.8, textAlign: 'center' },
  colPrecio: { flex: 1.2, textAlign: 'right' },
  colTotal: { flex: 1.2, textAlign: 'right' },
  itemRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    fontSize: 10,
  },
  itemNombre: { flex: 2 },
  itemCant: { flex: 0.8, textAlign: 'center' },
  itemPrecio: { flex: 1.2, textAlign: 'right' },
  itemTotal: { flex: 1.2, textAlign: 'right' },
  totales: {
    marginTop: 10,
    borderTop: '1px solid #ccc',
    paddingTop: 8,
  },
  totalLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
    fontSize: 11,
  },
  propina: {
    color: '#059669',
    fontWeight: 'bold',
  },
  totalFinal: {
    fontSize: 16,
    fontWeight: 'bold',
    borderTop: '2px solid #333',
    paddingTop: 6,
    marginTop: 4,
  },
  pago: {
    marginTop: 12,
    fontSize: 11,
    borderTop: '1px solid #ccc',
    paddingTop: 10,
  },
  pagoLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  footer: {
    textAlign: 'center',
    marginTop: 20,
    borderTop: '1px solid #ccc',
    paddingTop: 12,
  },
  footerText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  footerSmall: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
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
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image src={logoUrl} style={styles.logo} />
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.direccion}>Calle Principal #123</Text>
          <Text style={styles.telefono}>Tel: 310-555-1234</Text>
          <View style={styles.divider} />
          <Text style={styles.mesa}>Mesa {tableNumber || 'Caja'}</Text>
          <Text style={styles.fecha}>{new Date().toLocaleString()}</Text>
          <View style={styles.divider} />
        </View>

        {/* Items */}
        <View style={styles.columns}>
          <Text style={styles.colItem}>Producto</Text>
          <Text style={styles.colCant}>Cant</Text>
          <Text style={styles.colPrecio}>Precio</Text>
          <Text style={styles.colTotal}>Total</Text>
        </View>

        {items.map((item, index) => (
          <View key={index} style={styles.itemRow}>
            <Text style={styles.itemNombre}>{item.name}</Text>
            <Text style={styles.itemCant}>{item.qty}</Text>
            <Text style={styles.itemPrecio}>{formatCurrency(item.price)}</Text>
            <Text style={styles.itemTotal}>{formatCurrency(item.price * item.qty)}</Text>
          </View>
        ))}

        {/* Totales */}
        <View style={styles.totales}>
          <View style={styles.totalLine}>
            <Text>SUBTOTAL</Text>
            <Text>{formatCurrency(subtotal)}</Text>
          </View>
          {propina > 0 && (
            <View style={[styles.totalLine, styles.propina]}>
              <Text>PROPINA {propina === subtotal * 0.1 ? '10%' : ''}</Text>
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