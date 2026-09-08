import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import OrderCard from './OrderCard';

const OrdersTab = ({ safeOrders, subId }) => {
    const navigate = useNavigate();

    return (
        <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="flex justify-center md:justify-between items-center mb-4 md:mb-6">
                <h2 className="text-xl md:text-2xl font-serif font-bold text-[#141211] text-center md:text-left tracking-wide">My Orders</h2>
            </div>
            {safeOrders.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl shadow-sm text-center border border-stone-200">
                    <ShoppingBag className="w-12 h-12 text-[#C59B27]/40 mx-auto mb-4" />
                    <p className="text-stone-500 mb-6">No orders yet.</p>
                    <Link to="/shop" className="bg-[#141211] text-[#E8D198] border border-[#C59B27]/40 px-8 py-3 rounded-full hover:bg-[#1C1917] transition-all font-semibold tracking-wide">Start Shopping</Link>
                </div>
            ) : safeOrders.map(order => {
                const orderId = order.id || order._id;
                return (
                    <OrderCard
                        key={orderId}
                        order={order}
                        isExpanded={subId === orderId}
                        onToggle={() => navigate(subId === orderId ? '/profile/orders' : `/profile/orders/${orderId}`)}
                    />
                );
            })}
        </div>
    );
};

export default OrdersTab;
