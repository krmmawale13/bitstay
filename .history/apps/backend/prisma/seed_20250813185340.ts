// prisma/seed.ts
// Run with: npx ts-node prisma/seed.ts (or configure package.json seed script)
// This single file seeds ~4 records for every model, respecting FKs and uniqueness.

import { PrismaClient, Prisma, RoleEnum, BookingStatus, PaymentModeEnum, TaxTypeEnum, InvoiceStatus } from '@prisma/client'

const prisma = new PrismaClient()

// Utility helpers
const now = () => new Date()
const daysAgo = (n: number) => new Date(Date.now() - n * 86400000)
const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
const pick = <T>(arr: T[]): T => arr[rand(0, arr.length - 1)]

async function main() {
  console.log('🌱 Seeding started...')

  // 1) CORE / TENANTS
  const tenants = await prisma.$transaction(
    [
      prisma.tenant.create({ data: { name: 'Blue Banyan Hospitality', code: 'BBH001', gstin: '27AAACB1234C1Z5', address: 'Pune, MH', createdAt: daysAgo(60) } }),
      prisma.tenant.create({ data: { name: 'Coral Coast Resorts', code: 'CCR002', gstin: '29AAACR5678D1Z2', address: 'Mangaluru, KA', createdAt: daysAgo(45) } }),
      prisma.tenant.create({ data: { name: 'Maple Leaf Stays', code: 'MLS003', gstin: '07AAXXM9012Z1Z8', address: 'New Delhi, DL', createdAt: daysAgo(30) } }),
      prisma.tenant.create({ data: { name: 'Saffron Sands Inn', code: 'SSI004', gstin: '19AAASS3456Q1Z9', address: 'Kolkata, WB', createdAt: daysAgo(15) } }),
    ]
  )

  // 2) USERS + ROLES + PERMISSIONS + ROLE_PERMISSIONS + AUDIT + APPROVALS
  const permissions = await prisma.$transaction([
    prisma.permission.create({ data: { name: 'booking:create', description: 'Create bookings' } }),
    prisma.permission.create({ data: { name: 'booking:update', description: 'Update bookings' } }),
    prisma.permission.create({ data: { name: 'invoice:read', description: 'Read invoices' } }),
    prisma.permission.create({ data: { name: 'inventory:adjust', description: 'Adjust stock' } }),
  ])

  const roles = await prisma.$transaction([
    prisma.role.create({ data: { name: 'Admin', description: 'Full access' } }),
    prisma.role.create({ data: { name: 'Manager', description: 'Manage operations', tenantId: tenants[0].id } }),
    prisma.role.create({ data: { name: 'Receptionist', description: 'Front desk', tenantId: tenants[1].id } }),
    prisma.role.create({ data: { name: 'Cashier', description: 'Billing & payments', tenantId: tenants[2].id } }),
  ])

  await prisma.$transaction(
    permissions.map((p) =>
      prisma.rolePermission.create({ data: { roleId: roles[0].id, permissionId: p.id } })
    )
  )

  const users = await prisma.$transaction([
    prisma.user.create({ data: { tenantId: tenants[0].id, name: 'Aarav Sharma', email: 'aarav@bbh.example', password: 'hash_a1', role: RoleEnum.ADMIN } }),
    prisma.user.create({ data: { tenantId: tenants[1].id, name: 'Diya Rao', email: 'diya@ccr.example', password: 'hash_d1', role: RoleEnum.MANAGER } }),
    prisma.user.create({ data: { tenantId: tenants[2].id, name: 'Ishaan Kapoor', email: 'ishaan@mls.example', password: 'hash_i1', role: RoleEnum.RECEPTIONIST } }),
    prisma.user.create({ data: { tenantId: tenants[3].id, name: 'Meera Sen', email: 'meera@ssi.example', password: 'hash_m1', role: RoleEnum.CASHIER } }),
  ])

  await prisma.$transaction([
    prisma.auditLog.create({ data: { tenantId: tenants[0].id, userId: users[0].id, action: 'LOGIN', details: 'Successful login', createdAt: daysAgo(7) } }),
    prisma.auditLog.create({ data: { tenantId: tenants[1].id, userId: users[1].id, action: 'BOOKING_CREATE', details: 'Walk-in booking', createdAt: daysAgo(5) } }),
    prisma.auditLog.create({ data: { tenantId: tenants[2].id, userId: users[2].id, action: 'INVOICE_PRINT', details: 'Invoice #INV-ML-0001', createdAt: daysAgo(3) } }),
    prisma.auditLog.create({ data: { tenantId: tenants[3].id, userId: users[3].id, action: 'STOCK_ADJUST', details: 'Breakage recorded', createdAt: daysAgo(1) } }),
  ])

  await prisma.$transaction([
    prisma.approval.create({ data: { tenantId: tenants[0].id, module: 'INVENTORY', recordId: 1, status: 'APPROVED', requestBy: users[0].id } }),
    prisma.approval.create({ data: { tenantId: tenants[1].id, module: 'REFUND', recordId: 101, status: 'PENDING', requestBy: users[1].id } }),
    prisma.approval.create({ data: { tenantId: tenants[2].id, module: 'ROOM_MOVE', recordId: 202, status: 'APPROVED', requestBy: users[2].id } }),
    prisma.approval.create({ data: { tenantId: tenants[3].id, module: 'DISCOUNT', recordId: 303, status: 'REJECTED', requestBy: users[3].id } }),
  ])

  // 3) METADATA
  const states = await prisma.$transaction([
    prisma.state.create({ data: { name: 'Maharashtra' } }),
    prisma.state.create({ data: { name: 'Karnataka' } }),
    prisma.state.create({ data: { name: 'Delhi' } }),
    prisma.state.create({ data: { name: 'West Bengal' } }),
  ])

  const districts = await prisma.$transaction([
    prisma.district.create({ data: { stateId: states[0].id, name: 'Pune' } }),
    prisma.district.create({ data: { stateId: states[1].id, name: 'Dakshina Kannada' } }),
    prisma.district.create({ data: { stateId: states[2].id, name: 'New Delhi' } }),
    prisma.district.create({ data: { stateId: states[3].id, name: 'Kolkata' } }),
  ])

  const idTypes = await prisma.$transaction([
    prisma.idType.create({ data: { name: 'Passport' } }),
    prisma.idType.create({ data: { name: 'Driving License' } }),
    prisma.idType.create({ data: { name: 'Aadhaar' } }),
    prisma.idType.create({ data: { name: 'Voter ID' } }),
  ])

  const taxGroups = await prisma.$transaction([
    prisma.taxGroup.create({ data: { name: 'GST 0%', rate: new Prisma.Decimal('0.00') } }),
    prisma.taxGroup.create({ data: { name: 'GST 5%', rate: new Prisma.Decimal('5.00') } }),
    prisma.taxGroup.create({ data: { name: 'GST 12%', rate: new Prisma.Decimal('12.00') } }),
    prisma.taxGroup.create({ data: { name: 'GST 18%', rate: new Prisma.Decimal('18.00') } }),
  ])

  const hsnCodes = await prisma.$transaction([
    prisma.hsnSacCode.create({ data: { code: '996311', desc: 'Room or unit accommodation services' } }),
    prisma.hsnSacCode.create({ data: { code: '996331', desc: 'Restaurant services' } }),
    prisma.hsnSacCode.create({ data: { code: '220300', desc: 'Beer made from malt' } }),
    prisma.hsnSacCode.create({ data: { code: '220830', desc: 'Whiskies' } }),
  ])

  const roomTypes = await prisma.$transaction([
    prisma.roomType.create({ data: { name: 'Deluxe' } }),
    prisma.roomType.create({ data: { name: 'Suite' } }),
    prisma.roomType.create({ data: { name: 'Standard' } }),
    prisma.roomType.create({ data: { name: 'Family' } }),
  ])

  const bookingSources = await prisma.$transaction([
    prisma.bookingSource.create({ data: { name: 'Direct' } }),
    prisma.bookingSource.create({ data: { name: 'Booking.com' } }),
    prisma.bookingSource.create({ data: { name: 'MakeMyTrip' } }),
    prisma.bookingSource.create({ data: { name: 'Corporate' } }),
  ])

  const paymentModes = await prisma.$transaction([
    prisma.paymentMode.create({ data: { mode: 'Cash' } }),
    prisma.paymentMode.create({ data: { mode: 'Card' } }),
    prisma.paymentMode.create({ data: { mode: 'UPI' } }),
    prisma.paymentMode.create({ data: { mode: 'NetBanking' } }),
  ])

  const unitTypes = await prisma.$transaction([
    prisma.unitType.create({ data: { name: 'Bottle' } }),
    prisma.unitType.create({ data: { name: 'Peg' } }),
    prisma.unitType.create({ data: { name: 'Plate' } }),
    prisma.unitType.create({ data: { name: 'Piece' } }),
  ])

  const liquorCats = await prisma.$transaction([
    prisma.liquorCategory.create({ data: { name: 'Whisky' } }),
    prisma.liquorCategory.create({ data: { name: 'Rum' } }),
    prisma.liquorCategory.create({ data: { name: 'Vodka' } }),
    prisma.liquorCategory.create({ data: { name: 'Beer' } }),
  ])

  const liquorBrands = await prisma.$transaction([
    prisma.liquorBrand.create({ data: { name: 'Royal Stag', categoryId: liquorCats[0].id } }),
    prisma.liquorBrand.create({ data: { name: 'Old Monk', categoryId: liquorCats[1].id } }),
    prisma.liquorBrand.create({ data: { name: 'Smirnoff', categoryId: liquorCats[2].id } }),
    prisma.liquorBrand.create({ data: { name: 'Kingfisher', categoryId: liquorCats[3].id } }),
  ])

  const menuCategories = await prisma.$transaction([
    prisma.menuCategory.create({ data: { name: 'Starters' } }),
    prisma.menuCategory.create({ data: { name: 'Mains' } }),
    prisma.menuCategory.create({ data: { name: 'Beverages' } }),
    prisma.menuCategory.create({ data: { name: 'Desserts' } }),
  ])

  // 4) CUSTOMERS & ADDRESSES
  const customers = await prisma.$transaction([
    prisma.customer.create({ data: { tenantId: tenants[0].id, name: 'Rahul Verma', phone: '9876543210', email: 'rahul.verma@example.com', idTypeId: idTypes[2].id, idNumber: 'XXXX-1234-5678', gender: 'M', nationality: 'Indian', consent: true } }),
    prisma.customer.create({ data: { tenantId: tenants[1].id, name: 'Ananya Nair', phone: '9911223344', email: 'ananya.nair@example.com', idTypeId: idTypes[0].id, idNumber: 'P1234567', gender: 'F', nationality: 'Indian', consent: true } }),
    prisma.customer.create({ data: { tenantId: tenants[2].id, name: 'Karan Mehta', phone: '9988776655', email: 'karan.mehta@example.com', idTypeId: idTypes[1].id, idNumber: 'DL-09-2020123', gender: 'M', nationality: 'Indian' } }),
    prisma.customer.create({ data: { tenantId: tenants[3].id, name: 'Sneha Chakraborty', phone: '9765432109', email: 'sneha.chakraborty@example.com', idTypeId: idTypes[3].id, idNumber: 'WB/1234567', gender: 'F', nationality: 'Indian' } }),
  ])

  await prisma.$transaction([
    prisma.customerAddress.create({ data: { customerId: customers[0].id, line1: 'Baner', city: 'Pune', stateId: states[0].id, districtId: districts[0].id, pincode: '411045' } }),
    prisma.customerAddress.create({ data: { customerId: customers[1].id, line1: 'Kadri', city: 'Mangaluru', stateId: states[1].id, districtId: districts[1].id, pincode: '575002' } }),
    prisma.customerAddress.create({ data: { customerId: customers[2].id, line1: 'Saket', city: 'New Delhi', stateId: states[2].id, districtId: districts[2].id, pincode: '110017' } }),
    prisma.customerAddress.create({ data: { customerId: customers[3].id, line1: 'Salt Lake', city: 'Kolkata', stateId: states[3].id, districtId: districts[3].id, pincode: '700064' } }),
  ])

  // 5) HOTELS / ROOMS
  const hotels = await prisma.$transaction([
    prisma.hotel.create({ data: { tenantId: tenants[0].id, name: 'BBH City Centre', address: 'FC Road, Pune' } }),
    prisma.hotel.create({ data: { tenantId: tenants[1].id, name: 'Coral Bay', address: 'Panambur, Mangaluru' } }),
    prisma.hotel.create({ data: { tenantId: tenants[2].id, name: 'Maple Suites', address: 'South Ex, Delhi' } }),
    prisma.hotel.create({ data: { tenantId: tenants[3].id, name: 'Saffron Plaza', address: 'Park Street, Kolkata' } }),
  ])

  const rooms: { id: number }[] = []
  for (let i = 0; i < 4; i++) {
    const room = await prisma.room.create({
      data: {
        tenantId: tenants[i].id,
        hotelId: hotels[i].id,
        number: `${100 + i}`,
        typeId: roomTypes[i].id,
        status: i % 2 === 0 ? 'AVAILABLE' : 'OCCUPIED',
        rate: new Prisma.Decimal(3000 + i * 500),
      },
    })
    rooms.push({ id: room.id })
  }

  await prisma.$transaction([
    prisma.roomImage.create({ data: { roomId: rooms[0].id, url: 'https://img.example/rooms/BBH-100.jpg' } }),
    prisma.roomImage.create({ data: { roomId: rooms[1].id, url: 'https://img.example/rooms/CCR-101.jpg' } }),
    prisma.roomImage.create({ data: { roomId: rooms[2].id, url: 'https://img.example/rooms/MLS-102.jpg' } }),
    prisma.roomImage.create({ data: { roomId: rooms[3].id, url: 'https://img.example/rooms/SSI-103.jpg' } }),
  ])

  await prisma.$transaction([
    prisma.roomMaintenance.create({ data: { roomId: rooms[0].id, note: 'AC serviced' } }),
    prisma.roomMaintenance.create({ data: { roomId: rooms[1].id, note: 'Paint touch-up' } }),
    prisma.roomMaintenance.create({ data: { roomId: rooms[2].id, note: 'Shower replaced' } }),
    prisma.roomMaintenance.create({ data: { roomId: rooms[3].id, note: 'Carpet deep clean' } }),
  ])

  // 6) BAR / POS + MENU
  const bars = await prisma.$transaction([
    prisma.bar.create({ data: { tenantId: tenants[0].id, name: 'Sky Lounge', location: 'Rooftop' } }),
    prisma.bar.create({ data: { tenantId: tenants[1].id, name: 'Coast Bar', location: 'Lobby' } }),
    prisma.bar.create({ data: { tenantId: tenants[2].id, name: 'Maple Bar', location: 'Ground' } }),
    prisma.bar.create({ data: { tenantId: tenants[3].id, name: 'Saffron Bar', location: 'Mezzanine' } }),
  ])

  const posTables = await prisma.$transaction([
    prisma.posTable.create({ data: { tenantId: tenants[0].id, barId: bars[0].id, name: 'T1' } }),
    prisma.posTable.create({ data: { tenantId: tenants[1].id, barId: bars[1].id, name: 'T2' } }),
    prisma.posTable.create({ data: { tenantId: tenants[2].id, barId: bars[2].id, name: 'T3' } }),
    prisma.posTable.create({ data: { tenantId: tenants[3].id, barId: bars[3].id, name: 'T4' } }),
  ])

  const menuItems = await prisma.$transaction([
    prisma.menuItem.create({ data: { categoryId: menuCategories[0].id, name: 'Paneer Tikka', price: new Prisma.Decimal('280.00'), description: 'Cottage cheese with spices' } }),
    prisma.menuItem.create({ data: { categoryId: menuCategories[1].id, name: 'Butter Chicken', price: new Prisma.Decimal('420.00') } }),
    prisma.menuItem.create({ data: { categoryId: menuCategories[2].id, name: 'Masala Chai', price: new Prisma.Decimal('60.00') } }),
    prisma.menuItem.create({ data: { categoryId: menuCategories[3].id, name: 'Gulab Jamun', price: new Prisma.Decimal('120.00') } }),
  ])

  await prisma.$transaction([
    prisma.menuItemMetadata.create({ data: { menuItemId: menuItems[0].id, key: 'veg', value: 'true' } }),
    prisma.menuItemMetadata.create({ data: { menuItemId: menuItems[1].id, key: 'spice', value: 'medium' } }),
    prisma.menuItemMetadata.create({ data: { menuItemId: menuItems[2].id, key: 'size', value: '200ml' } }),
    prisma.menuItemMetadata.create({ data: { menuItemId: menuItems[3].id, key: 'servings', value: '2 pcs' } }),
  ])

  const posOrders = await prisma.$transaction([
    prisma.posOrder.create({ data: { tenantId: tenants[0].id, barId: bars[0].id, orderNumber: 'POS-BBH-0001', tableId: posTables[0].id, totalAmount: new Prisma.Decimal('400.00'), paymentMode: PaymentModeEnum.CARD, roomId: rooms[0].id } }),
    prisma.posOrder.create({ data: { tenantId: tenants[1].id, barId: bars[1].id, orderNumber: 'POS-CCR-0002', tableId: posTables[1].id, totalAmount: new Prisma.Decimal('540.00'), paymentMode: PaymentModeEnum.UPI, roomId: rooms[1].id } }),
    prisma.posOrder.create({ data: { tenantId: tenants[2].id, barId: bars[2].id, orderNumber: 'POS-MLS-0003', tableId: posTables[2].id, totalAmount: new Prisma.Decimal('180.00'), paymentMode: PaymentModeEnum.CASH, roomId: rooms[2].id } }),
    prisma.posOrder.create({ data: { tenantId: tenants[3].id, barId: bars[3].id, orderNumber: 'POS-SSI-0004', tableId: posTables[3].id, totalAmount: new Prisma.Decimal('240.00'), paymentMode: PaymentModeEnum.NETBANKING, roomId: rooms[3].id } }),
  ])

  await prisma.$transaction([
    prisma.posOrderItem.create({ data: { orderId: posOrders[0].id, menuItemId: menuItems[0].id, qty: 1, price: new Prisma.Decimal('280.00') } }),
    prisma.posOrderItem.create({ data: { orderId: posOrders[1].id, menuItemId: menuItems[1].id, qty: 1, price: new Prisma.Decimal('420.00') } }),
    prisma.posOrderItem.create({ data: { orderId: posOrders[2].id, menuItemId: menuItems[2].id, qty: 2, price: new Prisma.Decimal('60.00') } }),
    prisma.posOrderItem.create({ data: { orderId: posOrders[3].id, menuItemId: menuItems[3].id, qty: 2, price: new Prisma.Decimal('120.00') } }),
  ])

  await prisma.$transaction([
    prisma.kotTicket.create({ data: { orderId: posOrders[0].id, note: 'Less spicy' } }),
    prisma.kotTicket.create({ data: { orderId: posOrders[1].id, note: 'Extra gravy' } }),
    prisma.kotTicket.create({ data: { orderId: posOrders[2].id, note: 'Sugarless' } }),
    prisma.kotTicket.create({ data: { orderId: posOrders[3].id, note: 'Serve hot' } }),
  ])

  // 7) INVENTORY
  const items = await prisma.$transaction([
    prisma.inventoryItem.create({ data: { tenantId: tenants[0].id, name: 'Kingfisher Premium 650ml', sku: 'KF-650', unitTypeId: unitTypes[0].id } }),
    prisma.inventoryItem.create({ data: { tenantId: tenants[1].id, name: 'Royal Stag 750ml', sku: 'RS-750', unitTypeId: unitTypes[0].id } }),
    prisma.inventoryItem.create({ data: { tenantId: tenants[2].id, name: 'Gulab Jamun Mix 1kg', sku: 'GJ-1KG', unitTypeId: unitTypes[3].id } }),
    prisma.inventoryItem.create({ data: { tenantId: tenants[3].id, name: 'Assam Tea 250g', sku: 'AT-250', unitTypeId: unitTypes[3].id } }),
  ])

  const batches = await prisma.$transaction([
    prisma.inventoryBatch.create({ data: { itemId: items[0].id, batchCode: 'KF24B01', expiry: daysAgo(-180), mrp: new Prisma.Decimal('160.00') } }),
    prisma.inventoryBatch.create({ data: { itemId: items[1].id, batchCode: 'RS24B01', expiry: daysAgo(-365), mrp: new Prisma.Decimal('1050.00') } }),
    prisma.inventoryBatch.create({ data: { itemId: items[2].id, batchCode: 'GJ24B02', expiry: daysAgo(-300), mrp: new Prisma.Decimal('220.00') } }),
    prisma.inventoryBatch.create({ data: { itemId: items[3].id, batchCode: 'AT24B03', expiry: daysAgo(-400), mrp: new Prisma.Decimal('180.00') } }),
  ])

  await prisma.$transaction([
    prisma.stockRegister.create({ data: { itemId: items[0].id, qty: 48, note: 'Opening stock' } }),
    prisma.stockRegister.create({ data: { itemId: items[1].id, qty: 24, note: 'Purchase GRN' } }),
    prisma.stockRegister.create({ data: { itemId: items[2].id, qty: -2, note: 'Kitchen use' } }),
    prisma.stockRegister.create({ data: { itemId: items[3].id, qty: -1, note: 'Complimentary' } }),
  ])

  await prisma.$transaction([
    prisma.stockAdjustment.create({ data: { itemId: items[0].id, type: 'Breakage', qty: -1, note: 'Bottle slipped' } }),
    prisma.stockAdjustment.create({ data: { itemId: items[1].id, type: 'Audit', qty: 1, note: 'Count difference' } }),
    prisma.stockAdjustment.create({ data: { itemId: items[2].id, type: 'Spoilage', qty: -1 } }),
    prisma.stockAdjustment.create({ data: { itemId: items[3].id, type: 'Audit', qty: 0 } }),
  ])

  await prisma.$transaction([
    prisma.bottlingRecord.create({ data: { itemId: items[1].id, note: 'Pegging from 750ml' } }),
    prisma.bottlingRecord.create({ data: { itemId: items[0].id, note: 'Beer kegs to bottles' } }),
    prisma.bottlingRecord.create({ data: { note: 'Generic bar prep' } }),
    prisma.bottlingRecord.create({ data: { itemId: items[1].id, note: 'Repackaging' } }),
  ])

  // 8) SUPPLIERS & PURCHASES
  const suppliers = await prisma.$transaction([
    prisma.supplier.create({ data: { tenantId: tenants[0].id, name: 'United Beverages Ltd', gstNumber: '27AAACU0001F1ZP', contact: '020-4001000', email: 'sales@ubl.example', address: 'Hinjawadi, Pune' } }),
    prisma.supplier.create({ data: { tenantId: tenants[1].id, name: 'Ocean Foods', gstNumber: '29AAACO0002L1ZQ', contact: '0824-2202200', email: 'orders@oceanfoods.example', address: 'Surathkal, KA' } }),
    prisma.supplier.create({ data: { tenantId: tenants[2].id, name: 'Capital Supplies', gstNumber: '07AAACC0003R1ZS', contact: '011-46004600', email: 'enquiry@capsup.example', address: 'Okhla, Delhi' } }),
    prisma.supplier.create({ data: { tenantId: tenants[3].id, name: 'Bengal Traders', gstNumber: '19AAACB0004C1Z2', contact: '033-45004500', email: 'hello@btraders.example', address: 'Howrah, WB' } }),
  ])

  const purchaseOrders = await prisma.$transaction([
    prisma.purchaseOrder.create({ data: { tenantId: tenants[0].id, supplierId: suppliers[0].id, orderDate: daysAgo(20), status: 'OPEN', totalAmount: new Prisma.Decimal('15000.00') } }),
    prisma.purchaseOrder.create({ data: { tenantId: tenants[1].id, supplierId: suppliers[1].id, orderDate: daysAgo(18), status: 'PARTIAL', totalAmount: new Prisma.Decimal('9200.00') } }),
    prisma.purchaseOrder.create({ data: { tenantId: tenants[2].id, supplierId: suppliers[2].id, orderDate: daysAgo(12), status: 'CLOSED', totalAmount: new Prisma.Decimal('4800.00') } }),
    prisma.purchaseOrder.create({ data: { tenantId: tenants[3].id, supplierId: suppliers[3].id, orderDate: daysAgo(8), status: 'OPEN', totalAmount: new Prisma.Decimal('5600.00') } }),
  ])

  await prisma.$transaction([
    prisma.purchaseOrderItem.create({ data: { poId: purchaseOrders[0].id, itemId: items[0].id, qty: 30, unitPrice: new Prisma.Decimal('120.00') } }),
    prisma.purchaseOrderItem.create({ data: { poId: purchaseOrders[1].id, itemId: items[1].id, qty: 12, unitPrice: new Prisma.Decimal('800.00') } }),
    prisma.purchaseOrderItem.create({ data: { poId: purchaseOrders[2].id, itemId: items[2].id, qty: 10, unitPrice: new Prisma.Decimal('180.00') } }),
    prisma.purchaseOrderItem.create({ data: { poId: purchaseOrders[3].id, itemId: items[3].id, qty: 20, unitPrice: new Prisma.Decimal('120.00') } }),
  ])

  const grns = await prisma.$transaction([
    prisma.goodsReceipt.create({ data: { poId: purchaseOrders[0].id, note: 'Complete delivery' } }),
    prisma.goodsReceipt.create({ data: { poId: purchaseOrders[1].id, note: 'Partial - balance pending' } }),
    prisma.goodsReceipt.create({ data: { poId: purchaseOrders[2].id, note: 'Complete' } }),
    prisma.goodsReceipt.create({ data: { poId: purchaseOrders[3].id, note: 'Short delivery by 2 units' } }),
  ])

  const supplierInvoices = await prisma.$transaction([
    prisma.supplierInvoice.create({ data: { tenantId: tenants[0].id, supplierId: suppliers[0].id, invoiceNo: 'UBL/24-25/001', invoiceDate: daysAgo(19), totalAmount: new Prisma.Decimal('14400.00') } }),
    prisma.supplierInvoice.create({ data: { tenantId: tenants[1].id, supplierId: suppliers[1].id, invoiceNo: 'OF/24-25/112', invoiceDate: daysAgo(17), totalAmount: new Prisma.Decimal('9600.00') } }),
    prisma.supplierInvoice.create({ data: { tenantId: tenants[2].id, supplierId: suppliers[2].id, invoiceNo: 'CS/24-25/050', invoiceDate: daysAgo(11), totalAmount: new Prisma.Decimal('1800.00') } }),
    prisma.supplierInvoice.create({ data: { tenantId: tenants[3].id, supplierId: suppliers[3].id, invoiceNo: 'BT/24-25/078', invoiceDate: daysAgo(7), totalAmount: new Prisma.Decimal('6000.00') } }),
  ])

  await prisma.$transaction([
    prisma.gstPurchaseRegister.create({ data: { supplierInvoiceId: supplierInvoices[0].id, invoiceNo: supplierInvoices[0].invoiceNo, gstTaxable: new Prisma.Decimal('12203.39'), gstAmount: new Prisma.Decimal('2196.61') } }),
    prisma.gstPurchaseRegister.create({ data: { supplierInvoiceId: supplierInvoices[1].id, invoiceNo: supplierInvoices[1].invoiceNo, gstTaxable: new Prisma.Decimal('8135.59'), gstAmount: new Prisma.Decimal('1464.41') } }),
    prisma.gstPurchaseRegister.create({ data: { supplierInvoiceId: supplierInvoices[2].id, invoiceNo: supplierInvoices[2].invoiceNo, gstTaxable: new Prisma.Decimal('1525.42'), gstAmount: new Prisma.Decimal('274.58') } }),
    prisma.gstPurchaseRegister.create({ data: { supplierInvoiceId: supplierInvoices[3].id, invoiceNo: supplierInvoices[3].invoiceNo, gstTaxable: new Prisma.Decimal('5084.75'), gstAmount: new Prisma.Decimal('915.25') } }),
  ])

  // 9) SALES & BILLING
  const invoices = await prisma.$transaction([
    prisma.invoice.create({ data: { tenantId: tenants[0].id, customerId: customers[0].id, invoiceNo: 'INV-BBH-0001', status: InvoiceStatus.PAID, totalAmount: new Prisma.Decimal('3540.00'), taxAmount: new Prisma.Decimal('540.00'), paymentMode: PaymentModeEnum.CARD } }),
    prisma.invoice.create({ data: { tenantId: tenants[1].id, customerId: customers[1].id, invoiceNo: 'INV-CCR-0002', status: InvoiceStatus.PARTIAL, totalAmount: new Prisma.Decimal('4720.00'), taxAmount: new Prisma.Decimal('720.00'), paymentMode: PaymentModeEnum.UPI } }),
    prisma.invoice.create({ data: { tenantId: tenants[2].id, customerId: customers[2].id, invoiceNo: 'INV-MLS-0003', status: InvoiceStatus.DRAFT, totalAmount: new Prisma.Decimal('1880.00'), taxAmount: new Prisma.Decimal('280.00'), paymentMode: PaymentModeEnum.CASH } }),
    prisma.invoice.create({ data: { tenantId: tenants[3].id, customerId: customers[3].id, invoiceNo: 'INV-SSI-0004', status: InvoiceStatus.PAID, totalAmount: new Prisma.Decimal('2360.00'), taxAmount: new Prisma.Decimal('360.00'), paymentMode: PaymentModeEnum.NETBANKING } }),
  ])

  await prisma.$transaction([
    prisma.invoiceItem.create({ data: { invoiceId: invoices[0].id, itemId: items[0].id, qty: 6, price: new Prisma.Decimal('120.00'), taxRate: new Prisma.Decimal('18.00') } }),
    prisma.invoiceItem.create({ data: { invoiceId: invoices[1].id, itemId: items[1].id, qty: 2, price: new Prisma.Decimal('900.00'), taxRate: new Prisma.Decimal('18.00') } }),
    prisma.invoiceItem.create({ data: { invoiceId: invoices[2].id, itemId: items[2].id, qty: 3, price: new Prisma.Decimal('200.00'), taxRate: new Prisma.Decimal('5.00') } }),
    prisma.invoiceItem.create({ data: { invoiceId: invoices[3].id, itemId: items[3].id, qty: 4, price: new Prisma.Decimal('150.00'), taxRate: new Prisma.Decimal('5.00') } }),
  ])

  await prisma.$transaction([
    prisma.payment.create({ data: { invoiceId: invoices[0].id, amount: new Prisma.Decimal('3540.00'), mode: PaymentModeEnum.CARD } }),
    prisma.payment.create({ data: { invoiceId: invoices[1].id, amount: new Prisma.Decimal('2000.00'), mode: PaymentModeEnum.UPI } }),
    prisma.payment.create({ data: { invoiceId: invoices[2].id, amount: new Prisma.Decimal('0.00'), mode: PaymentModeEnum.CASH } }),
    prisma.payment.create({ data: { invoiceId: invoices[3].id, amount: new Prisma.Decimal('2360.00'), mode: PaymentModeEnum.NETBANKING } }),
  ])

  await prisma.$transaction([
    prisma.creditNote.create({ data: { invoiceId: invoices[1].id, amount: new Prisma.Decimal('200.00'), reason: 'Short delivery' } }),
    prisma.creditNote.create({ data: { invoiceId: invoices[2].id, amount: new Prisma.Decimal('100.00'), reason: 'Service delay' } }),
    prisma.creditNote.create({ data: { invoiceId: invoices[3].id, amount: new Prisma.Decimal('50.00'), reason: 'Courtesy' } }),
    prisma.creditNote.create({ data: { invoiceId: invoices[0].id, amount: new Prisma.Decimal('0.00'), reason: 'None' } }),
  ])

  await prisma.$transaction([
    prisma.gstSalesRegister.create({ data: { invoiceId: invoices[0].id, invoiceNo: invoices[0].invoiceNo, gstTaxable: new Prisma.Decimal('3000.00'), gstAmount: new Prisma.Decimal('540.00') } }),
    prisma.gstSalesRegister.create({ data: { invoiceId: invoices[1].id, invoiceNo: invoices[1].invoiceNo, gstTaxable: new Prisma.Decimal('4000.00'), gstAmount: new Prisma.Decimal('720.00') } }),
    prisma.gstSalesRegister.create({ data: { invoiceId: invoices[2].id, invoiceNo: invoices[2].invoiceNo, gstTaxable: new Prisma.Decimal('1600.00'), gstAmount: new Prisma.Decimal('280.00') } }),
    prisma.gstSalesRegister.create({ data: { invoiceId: invoices[3].id, invoiceNo: invoices[3].invoiceNo, gstTaxable: new Prisma.Decimal('2000.00'), gstAmount: new Prisma.Decimal('360.00') } }),
  ])

  await prisma.$transaction([
    prisma.hsnTaxSummary.create({ data: { hsnId: hsnCodes[0].id, taxable: new Prisma.Decimal('6000.00'), tax: new Prisma.Decimal('1080.00') } }),
    prisma.hsnTaxSummary.create({ data: { hsnId: hsnCodes[1].id, taxable: new Prisma.Decimal('3000.00'), tax: new Prisma.Decimal('540.00') } }),
    prisma.hsnTaxSummary.create({ data: { hsnId: hsnCodes[2].id, taxable: new Prisma.Decimal('2400.00'), tax: new Prisma.Decimal('432.00') } }),
    prisma.hsnTaxSummary.create({ data: { hsnId: hsnCodes[3].id, taxable: new Prisma.Decimal('1800.00'), tax: new Prisma.Decimal('324.00') } }),
  ])

  await prisma.$transaction([
    prisma.gstr1Export.create({ data: { data: JSON.stringify({ month: '2025-07', count: 4 }) } }),
    prisma.gstr2Export.create({ data: { data: JSON.stringify({ month: '2025-07', count: 4 }) } }),
    prisma.exciseDailyStock.create({ data: { note: 'Daily stock balanced' } }),
    prisma.exciseBrandReport.create({ data: { note: 'Brand-wise summary ready' } }),
  ])
  await prisma.exciseBreakageReport.create({ data: { note: '2 bottles breakage in bar' } })
  await prisma.exciseTransportPass.create({ data: { note: 'Permit approved for inward' } })

  // 10) NOTIFICATIONS / REPORTS / METADATA / FILES
  await prisma.$transaction([
    prisma.notification.create({ data: { tenantId: tenants[0].id, title: 'New Booking', body: 'Rahul Verma checked in' } }),
    prisma.notification.create({ data: { tenantId: tenants[1].id, title: 'Inventory Low', body: 'Kingfisher stock below threshold' } }),
    prisma.notification.create({ data: { tenantId: tenants[2].id, title: 'Payment Received', body: 'INV-MLS-0003 paid' } }),
    prisma.notification.create({ data: { tenantId: tenants[3].id, title: 'Report Ready', body: 'July GST summary generated' } }),
  ])

  const metaVersions = await prisma.$transaction([
    prisma.metadataVersion.create({ data: { tenantId: tenants[0].id, version: 'v2025.07.1', notes: 'Initial metadata' } }),
    prisma.metadataVersion.create({ data: { tenantId: tenants[1].id, version: 'v2025.07.1', notes: 'Initial metadata' } }),
    prisma.metadataVersion.create({ data: { tenantId: tenants[2].id, version: 'v2025.07.1', notes: 'Initial metadata' } }),
    prisma.metadataVersion.create({ data: { tenantId: tenants[3].id, version: 'v2025.07.1', notes: 'Initial metadata' } }),
  ])

  await prisma.$transaction([
    prisma.metadata.create({ data: { versionId: metaVersions[0].id, type: 'RATE_PLAN', key: 'Deluxe', value: 'EP' } }),
    prisma.metadata.create({ data: { versionId: metaVersions[1].id, type: 'RATE_PLAN', key: 'Suite', value: 'CP' } }),
    prisma.metadata.create({ data: { versionId: metaVersions[2].id, type: 'RATE_PLAN', key: 'Standard', value: 'MAP' } }),
    prisma.metadata.create({ data: { versionId: metaVersions[3].id, type: 'RATE_PLAN', key: 'Family', value: 'AP' } }),
  ])

  await prisma.$transaction([
    prisma.scheduledReport.create({ data: { tenantId: tenants[0].id, name: 'Daily Occupancy', cron: '0 7 * * *' } }),
    prisma.scheduledReport.create({ data: { tenantId: tenants[1].id, name: 'Sales Summary', cron: '0 8 * * 1' } }),
    prisma.scheduledReport.create({ data: { tenantId: tenants[2].id, name: 'Inventory Health', cron: '30 6 * * *' } }),
    prisma.scheduledReport.create({ data: { tenantId: tenants[3].id, name: 'GST Summary', cron: '0 9 1 * *' } }),
  ])

  await prisma.$transaction([
    prisma.fileStorage.create({ data: { tenantId: tenants[0].id, key: 'rooms/100.jpg', url: 'https://cdn.example/rooms/100.jpg', mimeType: 'image/jpeg', size: 128000 } }),
    prisma.fileStorage.create({ data: { tenantId: tenants[1].id, key: 'menus/main.pdf', url: 'https://cdn.example/menus/main.pdf', mimeType: 'application/pdf', size: 204800 } }),
    prisma.fileStorage.create({ data: { tenantId: tenants[2].id, key: 'invoices/INV-MLS-0003.pdf', url: 'https://cdn.example/invoices/INV-MLS-0003.pdf', mimeType: 'application/pdf', size: 102400 } }),
    prisma.fileStorage.create({ data: { tenantId: tenants[3].id, key: 'reports/gst-july.json', url: 'https://cdn.example/reports/gst-july.json', mimeType: 'application/json', size: 4096 } }),
  ])

  // 11) BOOKINGS FLOW
  const bookings = await prisma.$transaction([
    prisma.booking.create({ data: { tenantId: tenants[0].id, customerId: customers[0].id, sourceId: bookingSources[0].id, checkIn: daysAgo(2), checkOut: daysAgo(-1), status: BookingStatus.CHECKED_OUT } }),
    prisma.booking.create({ data: { tenantId: tenants[1].id, customerId: customers[1].id, sourceId: bookingSources[1].id, checkIn: daysAgo(1), checkOut: daysAgo(-2), status: BookingStatus.CANCELLED } }),
    prisma.booking.create({ data: { tenantId: tenants[2].id, customerId: customers[2].id, sourceId: bookingSources[2].id, checkIn: daysAgo(0), checkOut: daysAgo(-3), status: BookingStatus.CONFIRMED } }),
    prisma.booking.create({ data: { tenantId: tenants[3].id, customerId: customers[3].id, sourceId: bookingSources[3].id, checkIn: daysAgo(0), checkOut: daysAgo(2), status: BookingStatus.PENDING } }),
  ])

  await prisma.$transaction([
    prisma.bookingRoom.create({ data: { bookingId: bookings[0].id, roomId: rooms[0].id } }),
    prisma.bookingRoom.create({ data: { bookingId: bookings[1].id, roomId: rooms[1].id } }),
    prisma.bookingRoom.create({ data: { bookingId: bookings[2].id, roomId: rooms[2].id } }),
    prisma.bookingRoom.create({ data: { bookingId: bookings[3].id, roomId: rooms[3].id } }),
  ])

  await prisma.$transaction([
    prisma.bookingPayment.create({ data: { bookingId: bookings[0].id, amount: new Prisma.Decimal('3000.00'), modeId: paymentModes[1].id } }),
    prisma.bookingPayment.create({ data: { bookingId: bookings[1].id, amount: new Prisma.Decimal('2000.00'), modeId: paymentModes[2].id } }),
    prisma.bookingPayment.create({ data: { bookingId: bookings[2].id, amount: new Prisma.Decimal('1500.00'), modeId: paymentModes[0].id } }),
    prisma.bookingPayment.create({ data: { bookingId: bookings[3].id, amount: new Prisma.Decimal('2500.00'), modeId: paymentModes[3].id } }),
  ])

  await prisma.$transaction([
    prisma.bookingGuest.create({ data: { bookingId: bookings[0].id, name: 'Priya Verma', idTypeId: idTypes[2].id, idNumber: 'XXXX-1111-2222' } }),
    prisma.bookingGuest.create({ data: { bookingId: bookings[1].id, name: 'Rohit Nair', idTypeId: idTypes[0].id, idNumber: 'P7788990' } }),
    prisma.bookingGuest.create({ data: { bookingId: bookings[2].id, name: 'Aditi Mehta', idTypeId: idTypes[1].id, idNumber: 'DL-09-2020456' } }),
    prisma.bookingGuest.create({ data: { bookingId: bookings[3].id, name: 'Soumik Sen', idTypeId: idTypes[3].id, idNumber: 'WB/7654321' } }),
  ])

  await prisma.$transaction([
    prisma.roomAllocationHistory.create({ data: { bookingId: bookings[2].id, oldRoomId: rooms[2].id, newRoomId: rooms[2].id } }),
    prisma.roomAllocationHistory.create({ data: { bookingId: bookings[0].id, oldRoomId: rooms[0].id, newRoomId: rooms[0].id } }),
    prisma.roomAllocationHistory.create({ data: { bookingId: bookings[1].id, oldRoomId: rooms[1].id, newRoomId: rooms[1].id } }),
    prisma.roomAllocationHistory.create({ data: { bookingId: bookings[3].id, oldRoomId: rooms[3].id, newRoomId: rooms[3].id } }),
  ])

  console.log('✅ Seeding completed.')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
