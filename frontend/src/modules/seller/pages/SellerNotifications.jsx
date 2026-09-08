import React, { useEffect, useMemo, useState } from 'react';
import { Bell, CheckCircle2, ChevronLeft, ChevronRight, RefreshCw, Trash2 } from 'lucide-react';
import { sellerOrderService } from '../services/sellerOrderService';
import { useNavigate } from 'react-router-dom';

const clampInt = (value, fallback) => {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
};

const SellerNotifications = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });

  const query = useMemo(() => ({
    page,
    limit,
    isRead: onlyUnread ? 'false' : undefined,
  }), [page, limit, onlyUnread]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await sellerOrderService.getNotifications(query);
      const safeList = Array.isArray(res?.notifications) ? res.notifications : [];
      const safePagination = res?.pagination || null;
      setNotifications(safeList);
      if (safePagination) {
        setPagination({
          page: clampInt(safePagination.page, page),
          limit: clampInt(safePagination.limit, limit),
          total: clampInt(safePagination.total, 0),
          pages: clampInt(safePagination.pages, 1),
        });
      } else {
        setPagination({ page, limit, total: safeList.length, pages: 1 });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [query.page, query.isRead]);

  const markAllRead = async () => {
    await sellerOrderService.markNotificationsRead();
    // refresh list; if user is viewing only unread, it will likely go empty.
    await load();
  };

  const openNotification = async (n) => {
    const id = n?._id || n?.id;
    if (id && !n?.isRead) {
      await sellerOrderService.markNotificationRead(id);
    }
    if (n?.link) navigate(n.link);
  };

  return (
    <div className="p-4 lg:p-6 font-sans">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center">
              <Bell className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h1 className="text-sm lg:text-lg font-black text-gray-900 uppercase tracking-tight">Notifications</h1>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                {pagination.total} total
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => setOnlyUnread((v) => !v)}
              className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                onlyUnread ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
              title="Toggle unread filter"
            >
              {onlyUnread ? 'Unread Only' : 'All'}
            </button>
            <button
              type="button"
              onClick={markAllRead}
              className="px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-[#3E2723] text-white hover:bg-[#2D1B18] transition-all"
              title="Mark all as read"
            >
              Mark All Read
            </button>
            <button
              type="button"
              onClick={load}
              className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="divide-y divide-gray-50">
          {notifications.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-gray-100 mx-auto" strokeWidth={1} />
              <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">No notifications</p>
            </div>
          ) : (
            notifications.map((n) => {
              const id = n?._id || n?.id;
              return (
                <div
                  key={id}
                  className="w-full p-6 hover:bg-gray-50 transition-all flex items-start justify-between gap-4 group"
                >
                  <button
                    type="button"
                    onClick={() => openNotification(n)}
                    className="flex-1 min-w-0 text-left flex items-start gap-4 cursor-pointer focus:outline-none"
                  >
                    <div className={`w-2.5 h-2.5 rounded-full mt-2.5 flex-shrink-0 ${n?.isRead ? 'bg-gray-200' : 'bg-amber-500'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
                        <p className="text-[11px] font-black text-gray-900 uppercase tracking-tight line-clamp-1">
                          {n?.title || 'Notification'}
                        </p>
                        <p className="text-[9px] font-bold text-gray-400 uppercase whitespace-nowrap">
                          {new Date(n?.createdAt || Date.now()).toLocaleString()}
                        </p>
                      </div>
                      <p className="text-[10px] font-bold text-gray-500 mt-1 uppercase leading-relaxed line-clamp-2">
                        {n?.message || ''}
                      </p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (id) {
                        const success = await sellerOrderService.deleteNotification(id);
                        if (success) {
                          load();
                        }
                      }
                    }}
                    className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all self-center flex-shrink-0"
                    title="Delete notification"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        <div className="p-4 border-t border-gray-50 flex items-center justify-between">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Page {pagination.page} of {pagination.pages}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={pagination.page <= 1}
              className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white transition-all"
              title="Previous page"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(pagination.pages || 1, p + 1))}
              disabled={pagination.page >= pagination.pages}
              className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white transition-all"
              title="Next page"
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerNotifications;

