"use client"

import { Button } from '@/components/ui/button';
import { Product, SKU } from '@/types/schema';
import { Document, Image, Page, StyleSheet, Text, View, usePDF } from '@react-pdf/renderer';
import JsBarcode from 'jsbarcode';
import { Printer } from 'lucide-react';
import { useEffect, useState } from 'react';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#fff',
    padding: 10, 
  },
  labelContainer: {
    width: '33.33%',
    height: 90,     
    padding: 5,
    border: '1px dashed #eee',
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelContent: {
    width: '95%',
    height: '95%',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
  },
  productName: {
    fontSize: 8,
    marginBottom: 2,
    marginTop: 2,
    maxLines: 2,
    textOverflow: 'ellipsis',
    textAlign: 'center'
  },
  price: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 1,
  },
  barcode: {
    width: 100,
    height: 35,
  },
  skuCode: {
    fontSize: 6,
    marginTop: 1,
    color: '#666',
  }
});

interface BarcodeLabelsProps {
  skus: (SKU & { product?: Product })[];
}

const BarcodeLabelsDocument = ({ items }: { items: any[] }) => {
    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {items.map((item, index) => (
                    <View key={index} style={styles.labelContainer}>
                        <View style={styles.labelContent}>
                            <Text style={styles.price}>${Number(item.price).toFixed(2)}</Text>
                            {item.barcodeSrc ? (
                                <Image src={item.barcodeSrc} style={styles.barcode} />
                            ) : (
                                <View style={{alignItems: 'center', justifyContent: 'center', height: 40}}>
                                    <Text style={{fontSize: 8, color: 'red'}}>No Barcode</Text>
                                    <Text style={{fontSize: 8}}>{item.code}</Text>
                                </View>
                            )}
                            <Text style={styles.productName}>
                                {item.product?.name || "Producto"} 
                                {item.variantOptions?.length ? ` ${item.variantOptions.map((v: any)=>v.value).join(' ')}` : ''}
                            </Text>
                        </View>
                    </View>
                ))}
            </Page>
        </Document>
    );
};

export const BarcodePrintButton = ({ skus }: { skus: any[] }) => {
    const [isClient, setIsClient] = useState(false);
    const [readyToPrint, setReadyToPrint] = useState(false);
    const [itemsWithBarcodes, setItemsWithBarcodes] = useState<any[]>([]);

    useEffect(() => { 
        setIsClient(true);
        if (skus && skus.length > 0) {
            const processed = skus.map(sku => {
                let barcodeSrc = "";
                try {
                    const canvas = document.createElement("canvas");
                    const code = sku.barcode || sku.code;
                    if (code) {
                        const isNumeric = /^\d+$/.test(code);
                        const useEan = sku.barcodeType === 'EAN13' && code.length === 13 && isNumeric;

                        JsBarcode(canvas, code, {
                            format: useEan ? "EAN13" : "CODE128",
                            displayValue: true,
                            fontSize: 14,
                            marginBottom: 5,
                            height: 40,
                            width: 1.5,
                            margin: 0
                        });
                        barcodeSrc = canvas.toDataURL();
                    }
                } catch (e) {
                }
                return { ...sku, barcodeSrc };
            });
            setItemsWithBarcodes(processed);
            setReadyToPrint(true);
        }
    }, [skus]);

    const [instance, updateInstance] = usePDF({ 
        document: readyToPrint ? <BarcodeLabelsDocument items={itemsWithBarcodes} /> : <Document><Page></Page></Document> 
    });

    
    useEffect(() => {
        if (readyToPrint) {
            updateInstance(<BarcodeLabelsDocument items={itemsWithBarcodes} />);
        }
    }, [readyToPrint, itemsWithBarcodes, updateInstance]);

    if (!isClient) return null;

    if (!readyToPrint || instance.loading) return <Button disabled size="sm" variant="outline" className="hover:cursor-pointer"><Printer className="w-4 h-4 mr-2 animate-spin"/> Generando...</Button>;

    if (instance.error) return <Button disabled size="sm" variant="destructive" className="hover:cursor-pointer">Error PDF</Button>;

    return (
        <a href={instance.url!} target="_blank" rel="noreferrer">
            <Button size="sm" variant="outline" title="Imprimir Etiquetas" className="hover:cursor-pointer">
                <Printer className="w-4 h-4" />
            </Button>
        </a>
    );
};
