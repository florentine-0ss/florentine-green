import React, { useState } from 'react';
import { 
  X, MessageSquare, User as UserIcon, Send, Volume2, VolumeX, 
  Sparkles, ShieldCheck, Apple, Truck, Store, Scale, CornerDownRight, 
  ChevronRight, Radio, Bell, Users
} from 'lucide-react';
import { useRealtimeCommunity } from '../context/RealtimeCommunityContext';
import { ChatOnlineUser, PresenceToast } from '../types';

export const LivePresenceNotifications: React.FC = () => {
  const { 
    toasts, 
    dismissToast, 
    openChatForResponse, 
    onlineUsers, 
    soundEnabled, 
    toggleSound,
    unreadCount 
  } = useRealtimeCommunity();

  const [isRadarOpen, setIsRadarOpen] = useState(false);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return { label: 'Admin', color: 'bg-purple-100 text-purple-900 border-purple-200' };
      case 'stock_manager':
        return { label: 'Stock Manager', color: 'bg-blue-100 text-blue-900 border-blue-200' };
      case 'cashier':
        return { label: 'Cashier', color: 'bg-emerald-100 text-emerald-900 border-emerald-200' };
      case 'sales_attendant':
        return { label: 'Sales Attendant', color: 'bg-amber-100 text-amber-900 border-amber-200' };
      case 'accountant':
        return { label: 'Accountant', color: 'bg-teal-100 text-teal-900 border-teal-200' };
      default:
        return { label: 'Customer', color: 'bg-stone-100 text-stone-800 border-stone-200' };
    }
  };

  const handleRespondToJoin = (toast: PresenceToast) => {
    if (toast.user) {
      openChatForResponse({
        user: toast.user,
        channelId: 'general',
        prefillReply: `@${toast.user.userName} Muraho! Welcome! `
      });
    }
    dismissToast(toast.id);
  };

  const handleRespondToMessage = (toast: PresenceToast) => {
    if (toast.message) {
      openChatForResponse({
        channelId: toast.message.channelId || 'general',
        prefillReply: `@${toast.message.senderName} `
      });
    }
  const handleRespondToDirective = (toast: PresenceToast) => {
    if (toast.message) {
      openChatForResponse({
        channelId: toast.message.channelId || 'staff-internal',
        prefillReply: `@${toast.message.senderName} Received directive: `
      });
    } else {
      openChatForResponse({
        channelId: 'staff-internal',
        prefillReply: `@Florentine Mushimiyimana Understood Admin, on it! `
      });
    }
    dismissToast(toast.id);
  };

  return (
    <>
      {/* 1. FLOATING LIVE PRESENCE & MESSAGE TOASTS (Top Right) */}
      <div className="fixed top-20 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => {
          const roleBadge = toast.user ? getRoleBadge(toast.user.role) : null;
          const isJoin = toast.type === 'member_joined';
          const isDirective = toast.type === 'admin_directive';

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto bg-stone-900/95 text-white backdrop-blur-md rounded-2xl p-4 shadow-2xl border animate-in slide-in-from-right-8 duration-300 relative overflow-hidden group ${
                isDirective ? 'border-amber-500/80 ring-1 ring-amber-500/30' : 'border-stone-700/80'
              }`}
            >
              {/* Subtle top indicator bar */}
              <div 
                className={`absolute top-0 left-0 right-0 h-1.5 ${
                  isDirective 
                    ? 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 animate-pulse' 
                    : isJoin 
                      ? 'bg-gradient-to-r from-emerald-400 to-teal-400' 
                      : 'bg-gradient-to-r from-amber-400 to-emerald-400'
                }`}
              />

              <div className="flex items-start gap-3">
                {/* Avatar with Live Green Pulse Dot or Crown */}
                <div className="relative shrink-0 mt-0.5">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-md ${
                    isDirective
                      ? 'bg-amber-500 text-stone-950 font-black border border-amber-300'
                      : 'bg-emerald-800/80 text-emerald-200 border border-emerald-500/50'
                  }`}>
                    {isDirective ? (
                      '👑'
                    ) : isJoin && toast.user ? (
                      toast.user.userName.charAt(0).toUpperCase()
                    ) : toast.message ? (
                      toast.message.senderName.charAt(0).toUpperCase()
                    ) : (
                      <Users className="w-5 h-5" />
                    )}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-stone-900 shadow-sm animate-pulse" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-xs text-white truncate max-w-[150px]">
                        {toast.user ? toast.user.userName : toast.message?.senderName || toast.title}
                      </span>
                      {isDirective ? (
                        <span className="text-[9px] px-1.5 py-0.2 rounded font-extrabold bg-amber-400 text-stone-950 uppercase">
                          👑 Admin Directive
                        </span>
                      ) : roleBadge ? (
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-extrabold border uppercase ${roleBadge.color}`}>
                          {roleBadge.label}
                        </span>
                      ) : null}
                    </div>

                    <button
                      onClick={() => dismissToast(toast.id)}
                      className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
                      title="Dismiss"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-xs text-stone-300 font-medium mt-1 leading-snug line-clamp-2">
                    {toast.subtitle}
                  </p>

                  {/* Immediate Action Buttons */}
                  <div className="mt-3 flex items-center gap-2">
                    {isDirective ? (
                      <button
                        onClick={() => handleRespondToDirective(toast)}
                        className="flex-1 bg-amber-400 hover:bg-amber-300 active:scale-98 text-stone-950 font-black py-1.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-stone-950" />
                        <span>See Message & Send to Admin</span>
                      </button>
                    ) : isJoin ? (
                      <button
                        onClick={() => handleRespondToJoin(toast)}
                        className="flex-1 bg-emerald-500 hover:bg-emerald-400 active:scale-98 text-stone-950 font-black py-1.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-stone-950" />
                        <span>Say Hello & Respond Right Away</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRespondToMessage(toast)}
                        className="flex-1 bg-amber-400 hover:bg-amber-300 active:scale-98 text-stone-950 font-black py-1.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
                      >
                        <CornerDownRight className="w-3.5 h-3.5 text-stone-950" />
                        <span>Reply Immediately</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. RADAR DROPDOWN MODAL (Active Now list) */}
      {isRadarOpen && (
        <div className="fixed top-18 right-6 z-50 w-80 bg-stone-900/98 text-white backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-stone-700 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-stone-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Active Members Online ({onlineUsers.length})
              </h4>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={toggleSound}
                className={`p-1.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                  soundEnabled 
                    ? 'border-emerald-500/40 text-emerald-300 bg-emerald-500/10' 
                    : 'border-stone-700 text-stone-500 hover:text-stone-300'
                }`}
                title={soundEnabled ? 'Presence chimes enabled' : 'Presence chimes muted'}
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => setIsRadarOpen(false)}
                className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
            {onlineUsers.length === 0 ? (
              <p className="text-xs text-stone-400 text-center py-4">No other members online right now</p>
            ) : (
              onlineUsers.map((user) => {
                const badge = getRoleBadge(user.role);
                return (
                  <div
                    key={user.userId}
                    className="flex items-center justify-between p-2 rounded-xl bg-stone-800/60 hover:bg-stone-800 border border-stone-700/50 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="relative shrink-0">
                        <div className="w-7 h-7 rounded-full bg-emerald-800 text-emerald-200 font-bold text-xs flex items-center justify-center">
                          {user.userName.charAt(0).toUpperCase()}
                        </div>
                        <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">{user.userName}</p>
                        <span className={`text-[8px] px-1 py-0.2 rounded font-extrabold uppercase border ${badge.color}`}>
                          {badge.label}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        openChatForResponse({
                          user,
                          channelId: 'general',
                          prefillReply: `@${user.userName} `
                        });
                        setIsRadarOpen(false);
                      }}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] rounded-lg transition-colors cursor-pointer shrink-0"
                    >
                      Respond
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </>
  );
};
