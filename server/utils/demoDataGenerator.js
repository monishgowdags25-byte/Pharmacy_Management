/**
 * Demo Data Generator - Authentic Pharmacy Datasets & Synthetic Generators
 */

const DEMO_CATEGORIES = [
  { name: 'Pain Relief & Analgesics', description: 'NSAIDs, antipyretics, and pain management medications' },
  { name: 'Antibiotics & Anti-infectives', description: 'Broad-spectrum and targeted antibacterial agents' },
  { name: 'Cardiovascular & Hypertension', description: 'Blood pressure regulation and heart health pharmaceuticals' },
  { name: 'Diabetes Care & Endocrinology', description: 'Glycemic control tablets, insulin supplies, and metabolic support' },
  { name: 'Respiratory, Cold & Allergy', description: 'Antihistamines, bronchodilators, and decongestants' },
  { name: 'Gastrointestinal & Digestive', description: 'Proton-pump inhibitors, antacids, and digestive health' },
  { name: 'Vitamins, Minerals & Supplements', description: 'Nutritional supplements, immunity boosters, and minerals' },
  { name: 'Dermatology & Topical Care', description: 'Antiseptic ointments, corticosteroid creams, and skin healing' },
  { name: 'Ophthalmic & ENT Care', description: 'Eye, ear, and nasal drops and formulations' },
  { name: 'First Aid & Surgical Supplies', description: 'Bandages, antiseptics, gauges, and surgical dressing essentials' }
];

const DEMO_MEDICINES = [
  {
    name: 'Paracetamol Extra 500mg',
    genericName: 'Paracetamol',
    brand: 'Panadol / Calpol',
    categoryName: 'Pain Relief & Analgesics',
    manufacturer: 'GSK Pharmaceuticals',
    dosageForm: 'Tablet',
    strength: '500mg',
    unit: 'Strip (10s)',
    prescriptionRequired: false,
    purchasePrice: 15.00,
    sellingPrice: 28.00,
    tax: 5.0,
    reorderLevel: 25,
    barcode: '8901030010011'
  },
  {
    name: 'Ibuprofen Rapid 400mg',
    genericName: 'Ibuprofen',
    brand: 'Brufen / Advil',
    categoryName: 'Pain Relief & Analgesics',
    manufacturer: 'Abbott Healthcare',
    dosageForm: 'Tablet',
    strength: '400mg',
    unit: 'Strip (15s)',
    prescriptionRequired: false,
    purchasePrice: 22.50,
    sellingPrice: 38.00,
    tax: 5.0,
    reorderLevel: 20,
    barcode: '8901030010028'
  },
  {
    name: 'Amoxicillin Trihydrate 500mg',
    genericName: 'Amoxicillin',
    brand: 'Amoxil / Novamox',
    categoryName: 'Antibiotics & Anti-infectives',
    manufacturer: 'Cipla Ltd',
    dosageForm: 'Capsule',
    strength: '500mg',
    unit: 'Strip (10s)',
    prescriptionRequired: true,
    purchasePrice: 45.00,
    sellingPrice: 72.00,
    tax: 12.0,
    reorderLevel: 30,
    barcode: '8901030010035'
  },
  {
    name: 'Azithromycin 500mg',
    genericName: 'Azithromycin',
    brand: 'Zithromax / Azee',
    categoryName: 'Antibiotics & Anti-infectives',
    manufacturer: 'Pfizer India',
    dosageForm: 'Tablet',
    strength: '500mg',
    unit: 'Strip (3s)',
    prescriptionRequired: true,
    purchasePrice: 58.00,
    sellingPrice: 95.00,
    tax: 12.0,
    reorderLevel: 15,
    barcode: '8901030010042'
  },
  {
    name: 'Amlodipine Besylate 5mg',
    genericName: 'Amlodipine',
    brand: 'Norvasc / Amlong',
    categoryName: 'Cardiovascular & Hypertension',
    manufacturer: 'Sun Pharma Ltd',
    dosageForm: 'Tablet',
    strength: '5mg',
    unit: 'Strip (15s)',
    prescriptionRequired: true,
    purchasePrice: 28.00,
    sellingPrice: 48.00,
    tax: 5.0,
    reorderLevel: 20,
    barcode: '8901030010059'
  },
  {
    name: 'Metformin Hydrochloride 500mg',
    genericName: 'Metformin',
    brand: 'Glucophage / Glycomet',
    categoryName: 'Diabetes Care & Endocrinology',
    manufacturer: 'USV Private Ltd',
    dosageForm: 'Tablet',
    strength: '500mg',
    unit: 'Strip (20s)',
    prescriptionRequired: true,
    purchasePrice: 32.00,
    sellingPrice: 55.00,
    tax: 5.0,
    reorderLevel: 25,
    barcode: '8901030010066'
  },
  {
    name: 'Cetirizine Hydrochloride 10mg',
    genericName: 'Cetirizine',
    brand: 'Zyrtec / Cetzine',
    categoryName: 'Respiratory, Cold & Allergy',
    manufacturer: 'Dr. Reddy\'s Labs',
    dosageForm: 'Tablet',
    strength: '10mg',
    unit: 'Strip (10s)',
    prescriptionRequired: false,
    purchasePrice: 12.00,
    sellingPrice: 24.00,
    tax: 5.0,
    reorderLevel: 30,
    barcode: '8901030010073'
  },
  {
    name: 'Omeprazole Gastro-Resistant 20mg',
    genericName: 'Omeprazole',
    brand: 'Prilosec / Omez',
    categoryName: 'Gastrointestinal & Digestive',
    manufacturer: 'Dr. Reddy\'s Labs',
    dosageForm: 'Capsule',
    strength: '20mg',
    unit: 'Strip (15s)',
    prescriptionRequired: false,
    purchasePrice: 38.00,
    sellingPrice: 65.00,
    tax: 5.0,
    reorderLevel: 20,
    barcode: '8901030010080'
  },
  {
    name: 'Vitamin C Chewable + Zinc 500mg',
    genericName: 'Ascorbic Acid + Zinc',
    brand: 'Limcee / Celin',
    categoryName: 'Vitamins, Minerals & Supplements',
    manufacturer: 'Abbott Healthcare',
    dosageForm: 'Tablet',
    strength: '500mg',
    unit: 'Bottle (30s)',
    prescriptionRequired: false,
    purchasePrice: 42.00,
    sellingPrice: 75.00,
    tax: 5.0,
    reorderLevel: 15,
    barcode: '8901030010097'
  },
  {
    name: 'Oral Rehydration Salts (ORS) Orange',
    genericName: 'Electrolyte Salts',
    brand: 'Electral',
    categoryName: 'Gastrointestinal & Digestive',
    manufacturer: 'FDC Limited',
    dosageForm: 'Other',
    strength: '21.8g Sachet',
    unit: 'Box (25s)',
    prescriptionRequired: false,
    purchasePrice: 18.00,
    sellingPrice: 32.00,
    tax: 5.0,
    reorderLevel: 40,
    barcode: '8901030010103'
  },
  {
    name: 'Cough Relief Dextromethorphan Syrup',
    genericName: 'Dextromethorphan + CPM',
    brand: 'Benadryl DR / Ascoril',
    categoryName: 'Respiratory, Cold & Allergy',
    manufacturer: 'Glenmark Pharma',
    dosageForm: 'Syrup',
    strength: '100ml',
    unit: 'Bottle',
    prescriptionRequired: false,
    purchasePrice: 65.00,
    sellingPrice: 110.00,
    tax: 12.0,
    reorderLevel: 15,
    barcode: '8901030010110'
  },
  {
    name: 'Betadine Antiseptic Ointment 5%',
    genericName: 'Povidone-Iodine',
    brand: 'Betadine',
    categoryName: 'Dermatology & Topical Care',
    manufacturer: 'Win-Medicare',
    dosageForm: 'Ointment',
    strength: '20g Tube',
    unit: 'Tube',
    prescriptionRequired: false,
    purchasePrice: 48.00,
    sellingPrice: 85.00,
    tax: 12.0,
    reorderLevel: 10,
    barcode: '8901030010127'
  },
  {
    name: 'Salbutamol Inhaler 100mcg',
    genericName: 'Salbutamol',
    brand: 'Ventolin / Asthalin',
    categoryName: 'Respiratory, Cold & Allergy',
    manufacturer: 'Cipla Ltd',
    dosageForm: 'Inhaler',
    strength: '200 MDI Doses',
    unit: 'Canister',
    prescriptionRequired: true,
    purchasePrice: 95.00,
    sellingPrice: 165.00,
    tax: 12.0,
    reorderLevel: 12,
    barcode: '8901030010134'
  },
  {
    name: 'Ciprofloxacin Eye & Ear Drops',
    genericName: 'Ciprofloxacin 0.3%',
    brand: 'Ciplox Drops',
    categoryName: 'Ophthalmic & ENT Care',
    manufacturer: 'Cipla Ltd',
    dosageForm: 'Drops',
    strength: '10ml',
    unit: 'Vial',
    prescriptionRequired: true,
    purchasePrice: 24.00,
    sellingPrice: 45.00,
    tax: 5.0,
    reorderLevel: 15,
    barcode: '8901030010141'
  },
  {
    name: 'Sterile Cotton Bandage Roll (10cm)',
    genericName: 'Hydrophilic Gauze',
    brand: 'BandAid SurgiRoll',
    categoryName: 'First Aid & Surgical Supplies',
    manufacturer: 'Johnson & Johnson Med',
    dosageForm: 'Other',
    strength: '10cm x 5m',
    unit: 'Pack (5s)',
    prescriptionRequired: false,
    purchasePrice: 35.00,
    sellingPrice: 60.00,
    tax: 5.0,
    reorderLevel: 20,
    barcode: '8901030010158'
  }
];

const DEMO_SUPPLIERS = [
  {
    name: 'MediSource Distributors Pvt Ltd',
    contactPerson: 'Rajesh Sharma',
    companyName: 'MediSource Distributors',
    phone: '+91 9845012345',
    email: 'orders@medisource.pharmademo.com',
    vatNumber: '29AAACM1234F1Z5',
    paymentTerms: 'Net 30 Days',
    address: 'Plot 42, Industrial Area, Bangalore 560058',
    notes: 'Primary bulk distributor for generics and tablets'
  },
  {
    name: 'HealthPlus Pharma Logistics',
    contactPerson: 'Anjali Menon',
    companyName: 'HealthPlus Logistics India',
    phone: '+91 9886098765',
    email: 'supply@healthplus.pharmademo.com',
    vatNumber: '29BBBHP5678G2Z1',
    paymentTerms: 'Immediate / Google Pay',
    address: 'Warehouse 12, Bommasandra Link Road, Bangalore',
    notes: 'Authorized supply partner for antibiotics and cold-chain'
  },
  {
    name: 'CareMed Allied Distributors',
    contactPerson: 'Vikram Joshi',
    companyName: 'CareMed Healthcare Ltd',
    phone: '+91 9741033445',
    email: 'sales@caremed.pharmademo.com',
    vatNumber: '29CCCCM9012H3Z8',
    paymentTerms: 'Net 15 Days',
    address: '77 Ring Road, Mysore 570016',
    notes: 'Specializes in syrups, drops, and pediatric care'
  },
  {
    name: 'PrimeMed Life Sciences Supplies',
    contactPerson: 'Kavita Reddy',
    companyName: 'PrimeMed Life Sciences',
    phone: '+91 9900155667',
    email: 'info@primemed.pharmademo.com',
    vatNumber: '29DDDPM3456I4Z2',
    paymentTerms: 'Net 45 Days',
    address: 'Tech Pharma Zone, Peenya Phase 3, Bangalore',
    notes: 'Top tier distributor for cardiovascular and diabetes medicines'
  },
  {
    name: 'Apex Surgical & Pharma Wholesalers',
    contactPerson: 'Mohammed Farooq',
    companyName: 'Apex Surgical Wholesalers',
    phone: '+91 9844022119',
    email: 'apexwholesalers@pharmademo.com',
    vatNumber: '29EEEAS7890J5Z6',
    paymentTerms: 'Bank Transfer / RTGS',
    address: 'K.R. Market Wholesale Complex, Bangalore 560002',
    notes: 'Surgical bandages, first aid, and OTC healthcare essentials'
  }
];

const DEMO_CUSTOMERS = [
  { name: 'Arjun Ramesh', phone: '+91 9845110001', email: 'arjun.ramesh@samplemail.test', address: '14 Indiranagar 100ft Road, Bangalore', dateOfBirth: new Date('1988-04-12'), points: 120 },
  { name: 'Priya Sundaram', phone: '+91 9845110002', email: 'priya.s@samplemail.test', address: '88 Koramangala 4th Block, Bangalore', dateOfBirth: new Date('1994-09-25'), points: 85 },
  { name: 'Rohan Deshmukh', phone: '+91 9845110003', email: 'rohan.d@samplemail.test', address: '22 Jayanagar 9th Block, Bangalore', dateOfBirth: new Date('1976-11-03'), points: 210 },
  { name: 'Sneha Kulkarni', phone: '+91 9845110004', email: 'sneha.k@samplemail.test', address: '55 Malleshwaram 18th Cross, Bangalore', dateOfBirth: new Date('1990-02-18'), points: 60 },
  { name: 'Karthik Varma', phone: '+91 9845110005', email: 'karthik.v@samplemail.test', address: '10 HSR Layout Sector 2, Bangalore', dateOfBirth: new Date('1982-07-30'), points: 150 },
  { name: 'Deepa Narayan', phone: '+91 9845110006', email: 'deepa.n@samplemail.test', address: '45 Whitefield Main Road, Bangalore', dateOfBirth: new Date('1992-12-14'), points: 95 },
  { name: 'Suresh Babu', phone: '+91 9845110007', email: 'suresh.babu@samplemail.test', address: '12 Rajajinagar 1st Block, Bangalore', dateOfBirth: new Date('1965-05-20'), points: 340 },
  { name: 'Meera Iyer', phone: '+91 9845110008', email: 'meera.iyer@samplemail.test', address: '67 BTM Layout 2nd Stage, Bangalore', dateOfBirth: new Date('1998-08-08'), points: 40 }
];

const DEMO_EXPENSES = [
  { title: 'Store Monthly Rent - Retail Branch', category: 'Rent', amount: 35000, description: 'Monthly lease payment for commercial pharmacy premises' },
  { title: 'BESCOM Commercial Power Utility Bill', category: 'Electricity', amount: 4850, description: 'Electricity charges including 24/7 cold storage refrigeration' },
  { title: 'Store Assistant & Cashier Staff Salary', category: 'Salary', amount: 42000, description: 'Bi-monthly salary disbursement for pharmacy floor assistants' },
  { title: 'Air Conditioning & Refrigeration Maintenance', category: 'Maintenance', amount: 3200, description: 'Quarterly servicing of medicine chillers and temperature controllers' },
  { title: 'Local Delivery & Dispatch Fuel Expense', category: 'Transportation', amount: 1850, description: 'Fuel reimbursement for customer prescription home deliveries' },
  { title: 'Broadband Fiber & Telephone Lines', category: 'Utilities', amount: 1500, description: 'High-speed internet for cloud ERP billing and barcode sync' },
  { title: 'Thermal POS Paper Rolls & Stationery', category: 'Other', amount: 1200, description: 'Pack of 50 high-durability thermal receipt rolls and packaging bags' }
];

const DEMO_DOCTORS = [
  { name: 'Dr. Anand Kulkarni, MD', reg: 'KMC-44821', hospital: 'Manipal Hospital' },
  { name: 'Dr. Sunita Rao, MBBS, DNB', reg: 'KMC-55902', hospital: 'Apollo Clinic' },
  { name: 'Dr. Vinay Hegde, MS', reg: 'KMC-38119', hospital: 'Fortis Healthcare' },
  { name: 'Dr. Rashmi Patil, MD (Pediatrics)', reg: 'KMC-62340', hospital: 'Columbia Asia' }
];

module.exports = {
  DEMO_CATEGORIES,
  DEMO_MEDICINES,
  DEMO_SUPPLIERS,
  DEMO_CUSTOMERS,
  DEMO_EXPENSES,
  DEMO_DOCTORS
};
