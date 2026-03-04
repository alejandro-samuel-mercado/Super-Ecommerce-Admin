with open('src/components/management/sales/sale-details-dialog.tsx', 'r') as f:
    content = f.read()

old = "const canEditPayment = ['PENDING', 'REJECTED'].includes(sale.paymentStatus)"
new = "const canEditPayment = ['REJECTED'].includes(sale.paymentStatus) // Bloqueado en PENDING y CANCELLED"

if old in content:
    content = content.replace(old, new, 1)
    with open('src/components/management/sales/sale-details-dialog.tsx', 'w') as f:
        f.write(content)
    print("SUCCESS: sale-details-dialog.tsx patched")
else:
    print("NOT FOUND: pattern in sale-details-dialog.tsx")
