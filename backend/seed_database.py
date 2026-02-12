"""
Database seeder for Biocode application
Populates tables with realistic biomedical equipment data
"""

import sys
from datetime import datetime, timedelta
import random
from sqlalchemy.orm import Session

from app.database import SessionLocal, engine
from app.models import (
    Base, User, Department, Location, Equipment, Ticket, 
    EquipmentLog, EquipmentHistory, TicketResponse, MaintenanceSchedule,
    Supplier, Notification,
    UserRole, EquipmentStatus, LogType, TicketStatus
)
from app.auth import hash_password


def check_migrations_applied(db: Session):
    """Check if migrations have been run"""
    from sqlalchemy import inspect, text
    
    inspector = inspect(db.bind)
    tables = inspector.get_table_names()
    
    # Check if alembic_version table exists
    if 'alembic_version' not in tables:
        return False, "alembic_version table not found"
    
    # Check if all required tables exist
    required_tables = [
        'users', 'departments', 'locations', 'equipment', 'tickets',
        'equipment_logs', 'equipment_history', 'ticket_responses',
        'maintenance_schedules', 'suppliers', 'notifications'
    ]
    
    missing_tables = [table for table in required_tables if table not in tables]
    
    if missing_tables:
        return False, f"Missing tables: {', '.join(missing_tables)}"
    
    return True, "All migrations applied"


def clear_database(db: Session):
    """Clear all data from tables"""
    print("🗑️  Clearing existing data...")
    
    # Check if migrations have been run
    migrations_ok, message = check_migrations_applied(db)
    
    if not migrations_ok:
        print(f"\n❌ Error: {message}")
        print("\n⚠️  Migrations have not been run yet!")
        print("\nPlease run migrations first:")
        print("   cd backend")
        print("   python -m alembic upgrade head")
        print("\nOr use the reset script to do everything:")
        print("   cd backend")
        print("   python reset_database.py")
        sys.exit(1)
    
    # Delete in reverse order of dependencies
    db.query(Notification).delete()
    db.query(MaintenanceSchedule).delete()
    db.query(TicketResponse).delete()
    db.query(EquipmentHistory).delete()
    db.query(EquipmentLog).delete()
    db.query(Ticket).delete()
    db.query(Equipment).delete()
    db.query(Location).delete()
    db.query(Supplier).delete()
    db.query(Department).delete()
    db.query(User).delete()
    
    db.commit()
    print("✅ Database cleared")


def seed_users(db: Session, departments):
    """Create users with different roles and assign to departments"""
    print("\n👥 Seeding users...")
    
    # Get IT department for manager and support staff
    it_dept = next((d for d in departments if d.code == "IT"), None)
    
    # Get other departments for department_incharge users
    ed_dept = next((d for d in departments if d.code == "ED"), None)
    icu_dept = next((d for d in departments if d.code == "ICU"), None)
    rad_dept = next((d for d in departments if d.code == "RAD"), None)
    card_dept = next((d for d in departments if d.code == "CARD"), None)
    
    users_data = [
        {
            "email": "superadmin@biocode.com",
            "password": "admin123",
            "full_name": "Super Admin (Owner)",
            "role": UserRole.super_admin,
            "support_type": None,
            "department": None  # Super admin is the owner, not tied to a department
        },
        {
            "email": "manager@biocode.com",
            "password": "manager123",
            "full_name": "John Manager",
            "role": UserRole.manager,
            "support_type": None,
            "department": it_dept  # IT Department
        },
        {
            "email": "support1@biocode.com",
            "password": "support123",
            "full_name": "Sarah Johnson",
            "role": UserRole.support,
            "support_type": "biomed_tech",
            "department": it_dept  # IT Department - Biomed Tech
        },
        {
            "email": "support2@biocode.com",
            "password": "support123",
            "full_name": "Mike Davis",
            "role": UserRole.support,
            "support_type": "maintenance_electrician",
            "department": it_dept  # IT Department - Electrician
        },
        {
            "email": "support3@biocode.com",
            "password": "support123",
            "full_name": "Emily Chen",
            "role": UserRole.support,
            "support_type": "maintenance_aircon",
            "department": it_dept  # IT Department - Aircon Tech
        },
        {
            "email": "support4@biocode.com",
            "password": "support123",
            "full_name": "Carlos Rodriguez",
            "role": UserRole.support,
            "support_type": "maintenance_plumber",
            "department": it_dept  # IT Department - Plumber
        },
        {
            "email": "support5@biocode.com",
            "password": "support123",
            "full_name": "David Kim",
            "role": UserRole.support,
            "support_type": "it_staff",
            "department": it_dept  # IT Department - IT Staff
        },
        {
            "email": "incharge1@biocode.com",
            "password": "incharge123",
            "full_name": "Dr. Robert Smith",
            "role": UserRole.department_incharge,
            "support_type": None,
            "department": ed_dept  # Emergency Department
        },
        {
            "email": "incharge2@biocode.com",
            "password": "incharge123",
            "full_name": "Dr. Lisa Anderson",
            "role": UserRole.department_incharge,
            "support_type": None,
            "department": icu_dept  # ICU
        },
        {
            "email": "incharge3@biocode.com",
            "password": "incharge123",
            "full_name": "Dr. James Wilson",
            "role": UserRole.department_incharge,
            "support_type": None,
            "department": rad_dept  # Radiology
        },
        {
            "email": "incharge4@biocode.com",
            "password": "incharge123",
            "full_name": "Dr. Maria Garcia",
            "role": UserRole.department_incharge,
            "support_type": None,
            "department": card_dept  # Cardiology
        },
    ]
    
    users = []
    for data in users_data:
        user = User(
            email=data["email"],
            password_hash=hash_password(data["password"]),
            full_name=data["full_name"],
            role=data["role"],
            support_type=data["support_type"],
            is_active=True,
            department_id=data["department"].id if data["department"] else None
        )
        db.add(user)
        users.append(user)
    
    db.commit()
    print(f"✅ Created {len(users)} users")
    it_count = sum(1 for u in users if u.department_id == (it_dept.id if it_dept else None))
    other_count = sum(1 for u in users if u.department_id and u.department_id != (it_dept.id if it_dept else None))
    print(f"   - Super Admin (Owner): 1")
    print(f"   - IT Department (Manager + Support): {it_count}")
    print(f"   - Other Departments (Incharge): {other_count}")
    
    # Print support types breakdown
    support_users = [u for u in users if u.role == UserRole.support]
    if support_users:
        print(f"   - Support Staff Breakdown:")
        for user in support_users:
            print(f"     • {user.full_name}: {user.support_type}")
    
    return users


def seed_suppliers(db: Session):
    """Create medical equipment suppliers"""
    print("\n🏢 Seeding suppliers...")
    
    suppliers_data = [
        {
            "name": "MedTech Solutions Inc.",
            "code": "MTS",
            "contact_person": "John Anderson",
            "email": "sales@medtechsolutions.com",
            "phone": "+1-555-0101",
            "address": "123 Medical Plaza, Boston, MA 02101",
            "website": "www.medtechsolutions.com"
        },
        {
            "name": "Global Medical Equipment",
            "code": "GME",
            "contact_person": "Sarah Chen",
            "email": "info@globalmedequip.com",
            "phone": "+1-555-0202",
            "address": "456 Healthcare Ave, New York, NY 10001",
            "website": "www.globalmedequip.com"
        },
        {
            "name": "BioMed Supplies Co.",
            "code": "BMS",
            "contact_person": "Michael Rodriguez",
            "email": "contact@biomedsupplies.com",
            "phone": "+1-555-0303",
            "address": "789 Innovation Dr, San Francisco, CA 94102",
            "website": "www.biomedsupplies.com"
        },
        {
            "name": "Healthcare Systems Ltd.",
            "code": "HSL",
            "contact_person": "Emily Watson",
            "email": "sales@healthcaresystems.com",
            "phone": "+1-555-0404",
            "address": "321 Medical Center Blvd, Chicago, IL 60601",
            "website": "www.healthcaresystems.com"
        },
        {
            "name": "Advanced Diagnostics Corp.",
            "code": "ADC",
            "contact_person": "David Kim",
            "email": "info@advanceddiagnostics.com",
            "phone": "+1-555-0505",
            "address": "654 Tech Park Way, Seattle, WA 98101",
            "website": "www.advanceddiagnostics.com"
        },
    ]
    
    suppliers = []
    for data in suppliers_data:
        supplier = Supplier(
            name=data["name"],
            code=data["code"],
            contact_person=data["contact_person"],
            email=data["email"],
            phone=data["phone"],
            address=data["address"],
            website=data.get("website")
        )
        db.add(supplier)
        suppliers.append(supplier)
    
    db.commit()
    print(f"✅ Created {len(suppliers)} suppliers")
    return suppliers


def seed_departments(db: Session):
    """Create hospital departments"""
    print("\n🏥 Seeding departments...")
    
    departments_data = [
        {"name": "Information Technology", "code": "IT", "description": "IT support and biomedical engineering"},
        {"name": "Emergency Department", "code": "ED", "description": "Emergency and trauma care"},
        {"name": "Intensive Care Unit", "code": "ICU", "description": "Critical care unit"},
        {"name": "Operating Room", "code": "OR", "description": "Surgical procedures"},
        {"name": "Radiology", "code": "RAD", "description": "Medical imaging"},
        {"name": "Laboratory", "code": "LAB", "description": "Clinical laboratory"},
        {"name": "Cardiology", "code": "CARD", "description": "Heart and cardiovascular care"},
        {"name": "Pediatrics", "code": "PED", "description": "Children's healthcare"},
        {"name": "Oncology", "code": "ONC", "description": "Cancer treatment"},
    ]
    
    departments = []
    for data in departments_data:
        dept = Department(
            name=data["name"],
            code=data["code"],
            description=data.get("description")
        )
        db.add(dept)
        departments.append(dept)
    
    db.commit()
    print(f"✅ Created {len(departments)} departments")
    return departments


def seed_locations(db: Session):
    """Create hospital locations"""
    print("\n📍 Seeding locations...")
    
    locations_data = [
        {"name": "Main Building - 1st Floor", "code": "MB-1F", "building": "Main", "floor": "1", "room": None},
        {"name": "Main Building - 2nd Floor", "code": "MB-2F", "building": "Main", "floor": "2", "room": None},
        {"name": "Main Building - 3rd Floor", "code": "MB-3F", "building": "Main", "floor": "3", "room": None},
        {"name": "ICU Room 101", "code": "ICU-101", "building": "Main", "floor": "2", "room": "101"},
        {"name": "ICU Room 102", "code": "ICU-102", "building": "Main", "floor": "2", "room": "102"},
        {"name": "OR Suite 1", "code": "OR-1", "building": "Main", "floor": "3", "room": "OR-1"},
        {"name": "OR Suite 2", "code": "OR-2", "building": "Main", "floor": "3", "room": "OR-2"},
        {"name": "Radiology Wing", "code": "RAD-W", "building": "West Wing", "floor": "1", "room": None},
        {"name": "Lab - Main", "code": "LAB-M", "building": "Main", "floor": "1", "room": "Lab"},
        {"name": "Emergency Bay 1", "code": "ED-B1", "building": "Main", "floor": "1", "room": "Bay-1"},
    ]
    
    locations = []
    for data in locations_data:
        loc = Location(
            name=data["name"],
            code=data["code"],
            building=data["building"],
            floor=data["floor"],
            room=data["room"]
        )
        db.add(loc)
        locations.append(loc)
    
    db.commit()
    print(f"✅ Created {len(locations)} locations")
    return locations


def seed_equipment(db: Session, departments, locations, suppliers):
    """Create biomedical equipment"""
    print("\n🔧 Seeding equipment...")
    
    equipment_data = [
        # ICU Equipment
        {"device_name": "Ventilator", "manufacturer": "Dräger", "model": "Evita V800", "asset_tag": "VNT-001", "serial": "DRG2023001", "dept": "Intensive Care Unit", "status": EquipmentStatus.active, "repair_count": 0},
        {"device_name": "Ventilator", "manufacturer": "Dräger", "model": "Evita V800", "asset_tag": "VNT-002", "serial": "DRG2023002", "dept": "Intensive Care Unit", "status": EquipmentStatus.active, "repair_count": 1},
        {"device_name": "Patient Monitor", "manufacturer": "Philips", "model": "IntelliVue MX800", "asset_tag": "MON-001", "serial": "PHI2023001", "dept": "Intensive Care Unit", "status": EquipmentStatus.active, "repair_count": 0},
        {"device_name": "Patient Monitor", "manufacturer": "Philips", "model": "IntelliVue MX800", "asset_tag": "MON-002", "serial": "PHI2023002", "dept": "Intensive Care Unit", "status": EquipmentStatus.active, "repair_count": 2},
        {"device_name": "Infusion Pump", "manufacturer": "B. Braun", "model": "Infusomat Space", "asset_tag": "INF-001", "serial": "BBR2023001", "dept": "Intensive Care Unit", "status": EquipmentStatus.active, "repair_count": 0},
        
        # OR Equipment
        {"device_name": "Anesthesia Machine", "manufacturer": "GE Healthcare", "model": "Aisys CS2", "asset_tag": "ANS-001", "serial": "GEH2023001", "dept": "Operating Room", "status": EquipmentStatus.active, "repair_count": 1},
        {"device_name": "Surgical Light", "manufacturer": "Stryker", "model": "LED 5000", "asset_tag": "LGT-001", "serial": "STR2023001", "dept": "Operating Room", "status": EquipmentStatus.active, "repair_count": 0},
        {"device_name": "Electrosurgical Unit", "manufacturer": "Medtronic", "model": "ForceTriad", "asset_tag": "ESU-001", "serial": "MDT2023001", "dept": "Operating Room", "status": EquipmentStatus.active, "repair_count": 3},
        {"device_name": "Operating Table", "manufacturer": "Maquet", "model": "Alphamaxx", "asset_tag": "TBL-001", "serial": "MAQ2023001", "dept": "Operating Room", "status": EquipmentStatus.active, "repair_count": 0},
        
        # Radiology Equipment
        {"device_name": "X-Ray Machine", "manufacturer": "Siemens", "model": "Multix Fusion", "asset_tag": "XRY-001", "serial": "SIE2023001", "dept": "Radiology", "status": EquipmentStatus.active, "repair_count": 1},
        {"device_name": "CT Scanner", "manufacturer": "GE Healthcare", "model": "Revolution CT", "asset_tag": "CT-001", "serial": "GEH2023002", "dept": "Radiology", "status": EquipmentStatus.active, "repair_count": 0},
        {"device_name": "Ultrasound", "manufacturer": "Philips", "model": "EPIQ 7", "asset_tag": "US-001", "serial": "PHI2023003", "dept": "Radiology", "status": EquipmentStatus.active, "repair_count": 2},
        {"device_name": "MRI Scanner", "manufacturer": "Siemens", "model": "Magnetom Vida", "asset_tag": "MRI-001", "serial": "SIE2023002", "dept": "Radiology", "status": EquipmentStatus.out_of_service, "repair_count": 1},
        
        # Lab Equipment
        {"device_name": "Blood Gas Analyzer", "manufacturer": "Radiometer", "model": "ABL90 FLEX", "asset_tag": "BGA-001", "serial": "RAD2023001", "dept": "Laboratory", "status": EquipmentStatus.active, "repair_count": 0},
        {"device_name": "Hematology Analyzer", "manufacturer": "Sysmex", "model": "XN-1000", "asset_tag": "HEM-001", "serial": "SYS2023001", "dept": "Laboratory", "status": EquipmentStatus.active, "repair_count": 1},
        {"device_name": "Chemistry Analyzer", "manufacturer": "Roche", "model": "Cobas 8000", "asset_tag": "CHM-001", "serial": "ROC2023001", "dept": "Laboratory", "status": EquipmentStatus.active, "repair_count": 0},
        
        # Emergency Department
        {"device_name": "Defibrillator", "manufacturer": "ZOLL", "model": "R Series", "asset_tag": "DEF-001", "serial": "ZOL2023001", "dept": "Emergency Department", "status": EquipmentStatus.active, "repair_count": 0},
        {"device_name": "Defibrillator", "manufacturer": "ZOLL", "model": "R Series", "asset_tag": "DEF-002", "serial": "ZOL2023002", "dept": "Emergency Department", "status": EquipmentStatus.active, "repair_count": 1},
        {"device_name": "Portable X-Ray", "manufacturer": "Carestream", "model": "DRX-Revolution", "asset_tag": "PXR-001", "serial": "CAR2023001", "dept": "Emergency Department", "status": EquipmentStatus.active, "repair_count": 2},
        
        # Cardiology
        {"device_name": "ECG Machine", "manufacturer": "GE Healthcare", "model": "MAC 2000", "asset_tag": "ECG-001", "serial": "GEH2023003", "dept": "Cardiology", "status": EquipmentStatus.active, "repair_count": 0},
        {"device_name": "Echocardiography", "manufacturer": "Philips", "model": "EPIQ CVx", "asset_tag": "ECHO-001", "serial": "PHI2023004", "dept": "Cardiology", "status": EquipmentStatus.active, "repair_count": 1},
        
        # Retired Equipment
        {"device_name": "Old Monitor", "manufacturer": "Generic", "model": "M100", "asset_tag": "OLD-001", "serial": "GEN2015001", "dept": "Intensive Care Unit", "status": EquipmentStatus.retired, "repair_count": 5},
    ]
    
    equipment_list = []
    dept_map = {d.name: d for d in departments}
    
    for data in equipment_data:
        dept = dept_map.get(data["dept"])
        location = random.choice(locations) if locations else None
        supplier = random.choice(suppliers) if suppliers else None
        
        # Random in-service date within last 1-5 years
        days_ago = random.randint(365, 365 * 5)
        in_service_date = datetime.utcnow() - timedelta(days=days_ago)
        
        # Acquisition date is 30-90 days before in-service date
        acquisition_days_before = random.randint(30, 90)
        acquisition_date = in_service_date - timedelta(days=acquisition_days_before)
        
        # Random acquired value between $5,000 and $500,000
        acquired_value = f"${random.randint(5, 500) * 1000:,}"
        
        equip = Equipment(
            device_name=data["device_name"],
            manufacturer=data["manufacturer"],
            model=data["model"],
            asset_tag=data["asset_tag"],
            serial_number=data["serial"],
            status=data["status"],
            department_id=dept.id if dept else None,
            location_id=location.id if location else None,
            supplier_id=supplier.id if supplier else None,
            acquisition_date=acquisition_date,
            acquired_value=acquired_value,
            in_service_date=in_service_date,
            repair_count=data["repair_count"],
            notes=f"Acquired from {supplier.name if supplier else 'Unknown'} on {acquisition_date.strftime('%Y-%m-%d')}. Installed on {in_service_date.strftime('%Y-%m-%d')}"
        )
        db.add(equip)
        equipment_list.append(equip)
    
    db.commit()
    print(f"✅ Created {len(equipment_list)} equipment items")
    return equipment_list


def seed_tickets(db: Session, equipment_list, users):
    """Create service tickets"""
    print("\n🎫 Seeding tickets...")
    
    ticket_templates = [
        {"title": "Equipment not powering on", "concern": "Device fails to power on when connected", "priority": "high"},
        {"title": "Calibration required", "concern": "Annual calibration due", "priority": "medium"},
        {"title": "Display malfunction", "concern": "Screen showing error messages", "priority": "high"},
        {"title": "Alarm not working", "concern": "Audio alarm not functioning properly", "priority": "high"},
        {"title": "Preventive maintenance", "concern": "Scheduled PM due", "priority": "low"},
        {"title": "Battery replacement needed", "concern": "Battery not holding charge", "priority": "medium"},
        {"title": "Software update required", "concern": "System needs firmware update", "priority": "low"},
        {"title": "Sensor error", "concern": "Temperature sensor reading incorrectly", "priority": "high"},
        {"title": "Connectivity issue", "concern": "Cannot connect to network", "priority": "medium"},
        {"title": "Physical damage", "concern": "Casing cracked, needs replacement", "priority": "medium"},
    ]
    
    tickets = []
    support_staff = [u for u in users if u.role == UserRole.support]
    
    # Create 15 tickets with various statuses
    for i in range(15):
        equip = random.choice(equipment_list)
        template = random.choice(ticket_templates)
        reporter = random.choice(users)
        
        # Random creation date within last 60 days
        days_ago = random.randint(1, 60)
        created_at = datetime.utcnow() - timedelta(days=days_ago)
        
        # Determine status based on age
        if days_ago > 45:
            status = TicketStatus.closed
        elif days_ago > 30:
            status = TicketStatus.resolved
        elif days_ago > 15:
            status = TicketStatus.in_progress
        else:
            status = TicketStatus.open
        
        # Generate ticket code
        ticket_code = f"TKT{created_at.strftime('%Y%m')}{i+1:04d}"
        
        ticket = Ticket(
            ticket_code=ticket_code,
            equipment_id=equip.id,
            title=template["title"],
            description=template["concern"],
            priority=template["priority"],
            status=status,
            from_department=equip.department.name if equip.department else "Unknown",
            equipment_service=equip.device_name,
            serial_number=equip.serial_number,
            concern=template["concern"],
            reported_by=reporter.full_name,
            reported_by_user_id=reporter.id,
            assigned_to_user_id=random.choice(support_staff).id if status != TicketStatus.open else None,
            created_at=created_at,
            updated_at=created_at
        )
        db.add(ticket)
        tickets.append(ticket)
    
    db.commit()
    print(f"✅ Created {len(tickets)} tickets")
    return tickets


def seed_equipment_logs(db: Session, equipment_list, users):
    """Create equipment maintenance logs"""
    print("\n📝 Seeding equipment logs...")
    
    log_templates = [
        {"type": LogType.service, "title": "Repair completed", "desc": "Replaced faulty component and tested"},
        {"type": LogType.preventive_maintenance, "title": "Preventive maintenance", "desc": "Performed scheduled PM, all systems normal"},
        {"type": LogType.calibration, "title": "Calibration performed", "desc": "Device calibrated to manufacturer specifications"},
        {"type": LogType.inspection, "title": "Safety inspection", "desc": "Annual safety inspection completed"},
        {"type": LogType.incident, "title": "Equipment failure", "desc": "Device failed during operation, taken out of service"},
        {"type": LogType.note, "title": "General note", "desc": "Equipment relocated to new department"},
    ]
    
    logs = []
    support_staff = [u for u in users if u.role == UserRole.support]
    
    # Create 2-5 logs for equipment with repair_count > 0
    for equip in equipment_list:
        if equip.repair_count > 0:
            num_logs = random.randint(2, min(5, equip.repair_count + 2))
            
            for i in range(num_logs):
                template = random.choice(log_templates)
                support = random.choice(support_staff)
                
                # Random date within equipment's service life
                days_ago = random.randint(30, 365)
                occurred_at = datetime.utcnow() - timedelta(days=days_ago)
                
                log = EquipmentLog(
                    equipment_id=equip.id,
                    created_by_user_id=support.id,
                    log_type=template["type"],
                    title=template["title"],
                    description=template["desc"],
                    occurred_at=occurred_at,
                    downtime_minutes=random.randint(0, 480) if template["type"] in [LogType.service, LogType.incident] else 0,
                    resolved=True,
                    created_at=occurred_at
                )
                db.add(log)
                logs.append(log)
    
    db.commit()
    print(f"✅ Created {len(logs)} equipment logs")
    return logs


def seed_maintenance_schedules(db: Session, equipment_list, users):
    """Create maintenance schedules for equipment"""
    print("\n🔧 Seeding maintenance schedules...")
    
    maintenance_types = [
        {"type": "preventive", "frequency": 30, "weight": 0.4},  # Most common
        {"type": "calibration", "frequency": 90, "weight": 0.3},
        {"type": "inspection", "frequency": 180, "weight": 0.2},
        {"type": "safety_check", "frequency": 365, "weight": 0.1},
    ]
    
    schedules = []
    support_staff = [u for u in users if u.role in [UserRole.support, UserRole.manager]]
    
    # Only create schedules for active equipment with departments
    active_equipment = [e for e in equipment_list if e.status == EquipmentStatus.active and e.department_id]
    
    # Create 1-2 schedules for 70% of active equipment
    for equip in active_equipment:
        if random.random() < 0.7:  # 70% chance
            num_schedules = random.randint(1, 2)
            
            for _ in range(num_schedules):
                # Weighted random selection of maintenance type
                maint = random.choices(
                    maintenance_types,
                    weights=[m["weight"] for m in maintenance_types],
                    k=1
                )[0]
                
                # Random last maintenance date (0-60 days ago)
                days_since_last = random.randint(0, 60)
                last_maintenance = datetime.utcnow() - timedelta(days=days_since_last)
                
                # Calculate next maintenance date
                next_maintenance = last_maintenance + timedelta(days=maint["frequency"])
                
                # Randomly assign to support staff (80% chance)
                assigned_support = random.choice(support_staff) if random.random() < 0.8 else None
                
                # Generate notes based on maintenance type
                notes_options = {
                    "preventive": [
                        "Check all connections and cables",
                        "Clean filters and vents",
                        "Inspect for wear and tear",
                        "Test all functions and alarms",
                    ],
                    "calibration": [
                        "Calibrate to manufacturer specifications",
                        "Verify accuracy with test equipment",
                        "Document calibration results",
                        "Update calibration sticker",
                    ],
                    "inspection": [
                        "Visual inspection of all components",
                        "Check safety features",
                        "Verify proper operation",
                        "Document any issues found",
                    ],
                    "safety_check": [
                        "Annual safety inspection required",
                        "Check electrical safety",
                        "Verify emergency stop functions",
                        "Test backup power systems",
                    ],
                }
                
                notes = random.choice(notes_options[maint["type"]])
                
                schedule = MaintenanceSchedule(
                    equipment_id=equip.id,
                    maintenance_type=maint["type"],
                    frequency_days=maint["frequency"],
                    last_maintenance_date=last_maintenance if days_since_last > 0 else None,
                    next_maintenance_date=next_maintenance,
                    assigned_to_user_id=assigned_support.id if assigned_support else None,
                    notes=notes,
                    is_active=True
                )
                db.add(schedule)
                schedules.append(schedule)
    
    db.commit()
    print(f"✅ Created {len(schedules)} maintenance schedules")
    
    # Print some statistics
    overdue = sum(1 for s in schedules if s.next_maintenance_date < datetime.utcnow())
    upcoming_7 = sum(1 for s in schedules if datetime.utcnow() <= s.next_maintenance_date <= datetime.utcnow() + timedelta(days=7))
    upcoming_30 = sum(1 for s in schedules if datetime.utcnow() <= s.next_maintenance_date <= datetime.utcnow() + timedelta(days=30))
    
    print(f"   📊 Overdue: {overdue}")
    print(f"   📊 Due in 7 days: {upcoming_7}")
    print(f"   📊 Due in 30 days: {upcoming_30}")
    
    return schedules


def seed_notifications(db: Session, users, tickets, equipment_list, maintenance_schedules):
    """Create sample notifications for users"""
    print("\n🔔 Seeding notifications...")
    
    from app.models import Notification
    
    notification_templates = [
        {
            "type": "ticket_assigned",
            "title": "New Ticket Assigned",
            "message": "You have been assigned to ticket #{ticket_code}",
            "entity_type": "ticket",
        },
        {
            "type": "ticket_updated",
            "title": "Ticket Status Updated",
            "message": "Ticket #{ticket_code} status has been updated to In Progress",
            "entity_type": "ticket",
        },
        {
            "type": "maintenance_due",
            "title": "Maintenance Due Soon",
            "message": "Preventive maintenance for {equipment_name} is due in 3 days",
            "entity_type": "maintenance",
        },
        {
            "type": "maintenance_overdue",
            "title": "Maintenance Overdue",
            "message": "Calibration for {equipment_name} is overdue by 5 days",
            "entity_type": "maintenance",
        },
        {
            "type": "equipment_status",
            "title": "Equipment Status Changed",
            "message": "{equipment_name} status changed to Out of Service",
            "entity_type": "equipment",
        },
    ]
    
    notifications = []
    
    # Create 3-5 notifications per user
    for user in users:
        num_notifications = random.randint(3, 5)
        
        for _ in range(num_notifications):
            template = random.choice(notification_templates)
            
            # Determine related entity
            related_id = None
            message = template["message"]
            
            if template["entity_type"] == "ticket" and tickets:
                ticket = random.choice(tickets)
                related_id = ticket.id
                message = message.replace("{ticket_code}", ticket.ticket_code)
            elif template["entity_type"] == "equipment" and equipment_list:
                equipment = random.choice(equipment_list)
                related_id = equipment.id
                message = message.replace("{equipment_name}", equipment.device_name)
            elif template["entity_type"] == "maintenance" and maintenance_schedules:
                schedule = random.choice(maintenance_schedules)
                related_id = schedule.id
                # Get equipment name
                equipment = db.query(Equipment).filter(Equipment.id == schedule.equipment_id).first()
                if equipment:
                    message = message.replace("{equipment_name}", equipment.device_name)
            
            # Random created time (last 7 days)
            days_ago = random.randint(0, 7)
            hours_ago = random.randint(0, 23)
            created_at = datetime.utcnow() - timedelta(days=days_ago, hours=hours_ago)
            
            # 60% chance of being unread
            is_read = random.random() > 0.6
            read_at = created_at + timedelta(hours=random.randint(1, 12)) if is_read else None
            
            notification = Notification(
                user_id=user.id,
                title=template["title"],
                message=message,
                notification_type=template["type"],
                related_entity_type=template["entity_type"],
                related_entity_id=related_id,
                is_read=is_read,
                created_at=created_at,
                read_at=read_at,
            )
            db.add(notification)
            notifications.append(notification)
    
    db.commit()
    print(f"✅ Created {len(notifications)} notifications")
    
    # Print statistics
    unread = sum(1 for n in notifications if not n.is_read)
    print(f"   📊 Unread: {unread}")
    print(f"   📊 Read: {len(notifications) - unread}")
    
    return notifications


def main():
    """Main seeder function"""
    print("🌱 Starting database seeding...\n")
    
    # Create database session
    db = SessionLocal()
    
    try:
        # Clear existing data (includes migration check)
        clear_database(db)
        
        # Seed data in order - departments and suppliers first, then users
        departments = seed_departments(db)
        suppliers = seed_suppliers(db)
        users = seed_users(db, departments)
        locations = seed_locations(db)
        equipment_list = seed_equipment(db, departments, locations, suppliers)
        tickets = seed_tickets(db, equipment_list, users)
        logs = seed_equipment_logs(db, equipment_list, users)
        schedules = seed_maintenance_schedules(db, equipment_list, users)
        notifications = seed_notifications(db, users, tickets, equipment_list, schedules)
        
        print("\n" + "="*50)
        print("✨ Database seeding completed successfully!")
        print("="*50)
        print("\n📊 Summary:")
        print(f"   Users: {len(users)}")
        print(f"   Departments: {len(departments)}")
        print(f"   Suppliers: {len(suppliers)}")
        print(f"   Locations: {len(locations)}")
        print(f"   Equipment: {len(equipment_list)}")
        print(f"   Tickets: {len(tickets)}")
        print(f"   Equipment Logs: {len(logs)}")
        print(f"   Maintenance Schedules: {len(schedules)}")
        print(f"   Notifications: {len(notifications)}")
        
        print("\n🔑 Test Credentials:")
        print("   Super Admin (Owner):        superadmin@biocode.com / admin123")
        print("   Manager (IT):               manager@biocode.com / manager123")
        print("   Support - Biomed (IT):      support1@biocode.com / support123")
        print("   Support - Electrician (IT): support2@biocode.com / support123")
        print("   Support - Aircon (IT):      support3@biocode.com / support123")
        print("   Dept Incharge (ED):         incharge1@biocode.com / incharge123")
        print("   Dept Incharge (ICU):        incharge2@biocode.com / incharge123")
        
    except Exception as e:
        print(f"\n❌ Error during seeding: {e}")
        print("\n💡 Tip: If you see table-related errors, make sure migrations are run first:")
        print("   python -m alembic upgrade head")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()
