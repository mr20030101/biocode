import enum


class LifecycleType(str, enum.Enum):
    hours = "hours"
    years = "years"


class UserRole(str, enum.Enum):
    super_admin = "super_admin"
    manager = "manager"
    department_head = "department_head"
    support = "support"
    department_incharge = "department_incharge"


class EquipmentStatus(str, enum.Enum):
    active = "active"
    out_of_service = "out_of_service"
    retired = "retired"


class TicketStatus(str, enum.Enum):
    open = "open"
    in_progress = "in_progress"
    resolved = "resolved"
    closed = "closed"


class LogType(str, enum.Enum):
    create = "create"
    update = "update"
    delete = "delete"
    maintenance = "maintenance"
    system = "system"
