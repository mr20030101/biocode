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
    EquipmentLog, EquipmentHistory, TicketResponse,
    UserRole, EquipmentStatus, LogType, TicketStatus
)
from app.auth import hash_password


def clear_database(db: Session):
    """Clear all data from tables"""
    print("🗑️  Clearing existing data...")
    
    # Delete in reverse order of dependencies
    db.query(TicketResponse).delete()
    db.query(EquipmentHistory).delete()
    db.query(EquipmentLog).delete()
    db.query(Ticket).delete()
    db.query(Equipment).delete()
    db.query(Location).delete()
    db.query(Department).delete()
    db.query(User).delete()
    
    db.commit()
    print("✅ Database cleared")


def seed_users(db: Session):
    """Create users with different roles"""
    print("\n👥 Seeding users...")
    
    users_data = [
        {
            "email": "superadmin@biocode.com",
            "password": "admin123",
            "full_name": "Super Admin",
            "role": UserRole.super_admin
        },
        {
            "email": "supervisor@biocode.com",
            "password": "super123",
            "full_name": "John Supervisor",
            "role": UserRole.supervisor
        },
        {
            "email": "tech1@biocode.com",
            "password": "tech123",
            "full_name": "Sarah Johnson",
            "role": UserRole.tech
        },
        {
            "email": "tech2@biocode.com",
            "password": "tech123",
            "full_name": "Mike Davis",
            "role": UserRole.tech
        },
        {
            "email": "tech3@biocode.com",
            "password": "tech123",
            "full_name": "Emily Chen",
            "role": UserRole.tech
        },
        {
            "email": "viewer@biocode.com",
            "password": "viewer123",
            "full_name": "Viewer User",
            "role": UserRole.viewer
        },
    ]
    
    users = []
    for data in users_data:
        user = User(
            email=data["email"],
            password_hash=hash_password(data["password"]),
            full_name=data["full_name"],
            role=data["role"],
            is_active=True
        )
        db.add(user)
        users.append(user)
    
    db.commit()
    print(f"✅ Created {len(users)} users")
    return users


def seed_departments(db: Session):
    """Create hospital departments"""
    print("\n🏥 Seeding departments...")
    
    departments_data = [
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


def seed_equipment(db: Session, departments, locations):
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
        
        # Random in-service date within last 1-5 years
        days_ago = random.randint(365, 365 * 5)
        in_service_date = datetime.utcnow() - timedelta(days=days_ago)
        
        equip = Equipment(
            device_name=data["device_name"],
            manufacturer=data["manufacturer"],
            model=data["model"],
            asset_tag=data["asset_tag"],
            serial_number=data["serial"],
            status=data["status"],
            department_id=dept.id if dept else None,
            location_id=location.id if location else None,
            in_service_date=in_service_date,
            repair_count=data["repair_count"],
            notes=f"Installed on {in_service_date.strftime('%Y-%m-%d')}"
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
    techs = [u for u in users if u.role == UserRole.tech]
    
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
            assigned_to_user_id=random.choice(techs).id if status != TicketStatus.open else None,
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
    techs = [u for u in users if u.role == UserRole.tech]
    
    # Create 2-5 logs for equipment with repair_count > 0
    for equip in equipment_list:
        if equip.repair_count > 0:
            num_logs = random.randint(2, min(5, equip.repair_count + 2))
            
            for i in range(num_logs):
                template = random.choice(log_templates)
                tech = random.choice(techs)
                
                # Random date within equipment's service life
                days_ago = random.randint(30, 365)
                occurred_at = datetime.utcnow() - timedelta(days=days_ago)
                
                log = EquipmentLog(
                    equipment_id=equip.id,
                    created_by_user_id=tech.id,
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


def main():
    """Main seeder function"""
    print("🌱 Starting database seeding...\n")
    
    # Create database session
    db = SessionLocal()
    
    try:
        # Clear existing data
        clear_database(db)
        
        # Seed data in order
        users = seed_users(db)
        departments = seed_departments(db)
        locations = seed_locations(db)
        equipment_list = seed_equipment(db, departments, locations)
        tickets = seed_tickets(db, equipment_list, users)
        logs = seed_equipment_logs(db, equipment_list, users)
        
        print("\n" + "="*50)
        print("✨ Database seeding completed successfully!")
        print("="*50)
        print("\n📊 Summary:")
        print(f"   Users: {len(users)}")
        print(f"   Departments: {len(departments)}")
        print(f"   Locations: {len(locations)}")
        print(f"   Equipment: {len(equipment_list)}")
        print(f"   Tickets: {len(tickets)}")
        print(f"   Equipment Logs: {len(logs)}")
        
        print("\n🔑 Test Credentials:")
        print("   Super Admin: superadmin@biocode.com / admin123")
        print("   Supervisor:  supervisor@biocode.com / super123")
        print("   Tech:        tech1@biocode.com / tech123")
        print("   Viewer:      viewer@biocode.com / viewer123")
        
    except Exception as e:
        print(f"\n❌ Error during seeding: {e}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()
