import React, { useState } from 'react';
import { Search, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';

const DataTable = ({
    columns,
    data,
    searchTerm,
    setSearchTerm,
    searchPlaceholder = "Search...",
    filters,
    children,
    itemsPerPage = 10,
    // Optional server-side pagination mode: caller supplies already-paginated `data`
    // plus a pagination object controlling page/total and navigation.
    pagination,
    loading = false
}) => {
    const [internalPage, setInternalPage] = useState(1);
    const isServerPaged = Boolean(pagination && typeof pagination === 'object');
    const currentPage = isServerPaged ? (pagination.page || 1) : internalPage;

    // Calculate pagination
    const totalItems = isServerPaged ? Number(pagination.totalItems || 0) : data.length;
    const totalPages = isServerPaged
        ? Math.max(1, Number(pagination.totalPages || 1))
        : Math.ceil(data.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = isServerPaged ? data : data.slice(startIndex, startIndex + itemsPerPage);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            if (isServerPaged) {
                pagination.onPageChange?.(newPage);
            } else {
                setInternalPage(newPage);
            }
        }
    };

    return (
        <div className="space-y-3 md:space-y-4 animate-in fade-in duration-500">
            {/* Toolbar */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 md:p-5">
                <div className="space-y-4">
                    <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                        <input
                            type="text"
                            placeholder={searchPlaceholder}
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                if (isServerPaged) {
                                    pagination.onPageChange?.(1);
                                } else {
                                    setInternalPage(1);
                                }
                            }}
                            className="w-full h-11 pl-10 pr-4 bg-[#FAFAFA] border border-gray-200 rounded-2xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-[#8D6E63]/20 focus:border-[#8D6E63] transition-all text-gray-900 placeholder-gray-500 shadow-[0_1px_0_rgba(255,255,255,0.7)]"
                        />
                    </div>

                    {(filters || children) && (
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                            <div className="flex flex-wrap items-center gap-2 min-w-0">
                                {filters && (
                                    <>
                                        {filters.map((filter, index) => (
                                            <div key={index} className="relative shrink-0 w-full sm:w-auto">
                                                <select
                                                    {...(filter.value !== undefined ? { value: filter.value } : {})}
                                                    onChange={(e) => {
                                                        filter.onChange(e.target.value);
                                                        if (isServerPaged) {
                                                            pagination.onPageChange?.(1);
                                                        } else {
                                                            setInternalPage(1);
                                                        }
                                                    }}
                                                    className="w-full sm:w-auto h-10 bg-[#FAFAFA] border border-gray-200 rounded-full pl-4 pr-10 text-[11px] md:text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#8D6E63]/20 appearance-none cursor-pointer shadow-[0_1px_0_rgba(255,255,255,0.7)]"
                                                >
                                                    {filter.options.map((opt, i) => (
                                                        <option key={i} value={opt.value}>{opt.label}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                                            </div>
                                        ))}
                                    </>
                                )}
                            </div>

                            {children && (
                                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                                    {children}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-white border-b border-gray-200">
                            <tr>
                                {columns.map((col, index) => (
                                    <th key={index} className={`px-4 md:px-6 py-4 text-gray-800 font-bold uppercase tracking-widest text-[10px] md:text-xs ${col.align === 'right' ? 'text-right' : ''}`}>
                                        {col.header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-gray-900">
                             {loading ? (
                                <tr>
                                    <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-500 font-semibold text-xs">
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-4 h-4 border-2 border-[#8D6E63]/30 border-t-[#8D6E63] rounded-full animate-spin" />
                                            Loading...
                                        </div>
                                    </td>
                                </tr>
                            ) : paginatedData.length > 0 ? (
                                paginatedData.map((item, rowIndex) => (
                                    <tr key={startIndex + rowIndex} className="hover:bg-gray-50/50 transition-colors">
                                        {columns.map((col, colIndex) => (
                                            <td key={colIndex} className={`px-4 md:px-6 py-2 md:py-2.5 ${col.align === 'right' ? 'text-right' : ''}`}>
                                                {col.render ? col.render(item) : item[col.key]}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-600 font-medium text-xs">
                                        No results found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {totalItems > 0 && (
                    <div className="px-4 md:px-6 py-3 border-t border-gray-200 flex items-center justify-between text-xs md:text-sm text-gray-500">
                        <span>
                            Showing {totalItems === 0 ? 0 : (startIndex + 1)} to {Math.min(startIndex + paginatedData.length, totalItems)} of {totalItems} entries
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="p-1 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
                            </button>
                            <span className="font-medium text-gray-900">Page {currentPage} of {totalPages}</span>
                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="p-1 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DataTable;
