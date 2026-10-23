import React, { useState, useRef, useEffect } from 'react';
import { 
  ShieldCheck, 
  Boxes, 
  Store, 
  Smile, 
  Scale, 
  Apple, 
  ChevronDown, 
  Check, 
  ExternalLink,
  Sparkles,
  Users,
  KeyRound
} from 'lucide-react';
import { User, UserRole } from '../types';

interface RoleWorkspaceBarProps {
  currentUser: User | null;
  onSwitchRole: (role: UserRole) => void;
  onOpenActiveWorkspace: () => void;
  stockAlertsCount?: number;
}

export const ROLE_DEFINITIONS: Array<{
  role: UserRole;
  label: string;
  title: string;
  badge: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  icon: any;
  defaultUserName: string;
  department: string;
  summary: string;
}> = [
  {
    role: 'admin',
    label: '1. Admin',
    title: 'System Administrator',
    badge: 'Executive',
    bgColor: 'bg-amber-500',
    textColor: 'text-amber-950',
    borderColor: 'border-amber-400',
    icon: ShieldCheck,
    defaultUserName: 'Florentine Mushimiyimana',
    department: 'Executive Administration',
    summary: 'Managing staff accounts, granting access rights, monitoring products & profit reports'
  },
  {
    role: 'stock_manager',
    label: '2. Stock Manager',
    title: 'Warehouse & Inventory',
    badge: 'Stock In / Damaged',
    bgColor: 'bg-blue-600',
    textColor: 'text-blue-950',
    borderColor: 'border-blue-400',
    icon: Boxes,
    defaultUserName: 'Eric Mugisha',
    department: 'Warehouse & Inventory Control',
    summary: 'Receiving stock, recording levels, tracking damaged goods & alerting manager'
  },
  {
    role: 'cashier',
    label: '3. Cashier',
    title: 'POS Register & Payments',
    badge: 'Cash & MoMo',
    bgColor: 'bg-emerald-600',
    textColor: 'text-emerald-950',
    borderColor: 'border-emerald-400',
    icon: Store,
    defaultUserName: 'Chantal Uwera',
    department: 'Checkout POS & Payments',
    summary: 'Processing payments, cash & MoMo (*182#), issuing receipts, confirming sales'
  },
  {
    role: 'sales_attendant',
    label: '4. Sales Attendant',
    title: 'Assisted Customer Shopping',
    badge: 'Kiosk & Advice',
    bgColor: 'bg-violet-600',
    textColor: 'text-violet-950',
    borderColor: 'border-violet-400',
    icon: Smile,
    defaultUserName: 'Kevin Niyonzima',
    department: 'Customer Service & Floor Sales',
    summary: 'Welcoming customers, showing prices, building assisted baskets & cashier handoff'
  },
  {
    role: 'accountant',
    label: '5. Accountant',
    title: 'Financial Control & P&L',
    badge: 'Ledger & Audit',
    bgColor: 'bg-teal-600',
    textColor: 'text-teal-950',
    borderColor: 'border-teal-400',
    icon: Scale,
    defaultUserName: 'Aimee Mukamana',
    department: 'Finance, Tax & Audit',
    summary: 'Tracking income & expenditures, purchase vs selling margins, P&L calculations'
  },
  {
    role: 'customer',
    label: '6. Customer',
    title: 'Fruit Market & Feedback',
    badge: 'Shopper',
    bgColor: 'bg-rose-600',
    textColor: 'text-rose-950',
    borderColor: 'border-rose-400',
    icon: Apple,
    defaultUserName: 'Divine Uwase',
    department: 'Verified Shopper',
    summary: 'View fruits & prices, select items, pay with Cash or MoMo, receipt & reviews'
  }
];

export const RoleWorkspaceBar: React.FC<RoleWorkspaceBarProps> = ({
  currentUser,
  onSwitchRole,
  onOpenActiveWorkspace,
  stockAlertsCount = 0
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeRoleDef = ROLE_DEFINITIONS.find(r => r.role === currentUser?.role) || ROLE_DEFINITIONS[0];
  const IconComponent = activeRoleDef.icon;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="bg-stone-900 text-white text-xs border-b border-stone-800 py-1.5 px-3 sm:px-6 sticky top-0 z-45 transition-all">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        
        {/* Left: Active Role Capsule & Switcher */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-bold text-stone-400 hidden md:inline">
            Active System Role:
          </span>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-100 transition-all cursor-pointer shadow-2xs"
            >
              <div className={`w-5 h-5 rounded-md ${activeRoleDef.bgColor} text-white flex items-center justify-center shrink-0`}>
                <IconComponent className="w-3.5 h-3.5" />
              </div>
              <div className="flex items-center gap-1.5 text-left">
                <span className="font-extrabold text-white text-xs">{activeRoleDef.label}</span>
                <span className="text-[10px] text-stone-400 hidden sm:inline">• {activeRoleDef.title}</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
            </button>

            {/* Dropdown with all 6 roles */}
            {dropdownOpen && (
              <div className="absolute left-0 mt-2 w-80 sm:w-96 bg-white text-stone-900 rounded-2xl shadow-2xl border border-stone-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-4 py-2 border-b border-stone-100 bg-stone-50">
                  <p className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
                    Switch Workspace Role (6 System Roles)
                  </p>
                  <p className="text-xs text-stone-600 mt-0.5">
                    Select any role to test its dedicated permissions, tools, and actions.
                  </p>
                </div>

                <div className="p-1.5 space-y-1">
                  {ROLE_DEFINITIONS.map((def) => {
                    const RoleIcon = def.icon;
                    const isSelected = def.role === currentUser?.role;

                    return (
                      <button
                        key={def.role}
                        onClick={() => {
                          onSwitchRole(def.role);
                          setDropdownOpen(false);
                        }}
                        className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start gap-3 cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-50 border border-emerald-300'
                            : 'hover:bg-stone-100'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-xl ${def.bgColor} text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs`}>
                          <RoleIcon className="w-4 h-4" />
                        </div>

                        <div className="flex-1 overflow-hidden">
                          <div className="flex items-center justify-between">
                            <span className="font-black text-xs text-stone-900">{def.label}: {def.title}</span>
                            {isSelected && (
                              <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                            )}
                          </div>
                          <p className="text-[11px] text-stone-500 truncate mt-0.5">{def.summary}</p>
                          <p className="text-[10px] text-stone-400 mt-0.5">
                            Default Staff: <span className="font-semibold text-stone-700">{def.defaultUserName}</span>
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <span className="text-[11px] text-stone-400 hidden xl:inline">
            Logged in: <strong className="text-stone-200">{currentUser?.name || activeRoleDef.defaultUserName}</strong>
          </span>
        </div>

        {/* Right: Fast Launch Dedicated Workspace Action Button */}
        <div className="flex items-center gap-2">
          {currentUser?.role === 'stock_manager' && stockAlertsCount > 0 && (
            <span className="bg-rose-600/90 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">
              {stockAlertsCount} Low Stock
            </span>
          )}

          <button
            onClick={onOpenActiveWorkspace}
            className={`px-3 py-1 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer ${
              activeRoleDef.bgColor
            } text-white hover:opacity-95`}
          >
            <IconComponent className="w-3.5 h-3.5" />
            <span>Open {activeRoleDef.label} Workspace</span>
            <ExternalLink className="w-3 h-3 opacity-80" />
          </button>
        </div>

      </div>
    </div>
  );
};
