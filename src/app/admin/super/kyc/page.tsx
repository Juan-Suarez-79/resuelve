"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import {
    useReactTable,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    flexRender,
    createColumnHelper
} from "@tanstack/react-table";
import {
    Search,
    CheckCircle2,
    XCircle,
    Loader2,
    ChevronLeft,
    ChevronRight,
    ExternalLink
} from "lucide-react";
import { useToast } from "@/components/ui/toast";

interface Store {
    id: string;
    name: string;
    owner_id: string;
    approval_status: string;
    created_at: string;
    profiles: {
        full_name: string;
        email: string;
        cedula: string;
        cedula_photo_url: string;
        selfie_holding_id_url: string;
    };
}

export default function KYCVerificationPage() {
    const [data, setData] = useState<Store[]>([]);
    const [loading, setLoading] = useState(true);
    const [globalFilter, setGlobalFilter] = useState("");

    const supabase = createClient();
    const { toast } = useToast();

    // Fetch Pending Stores
    const fetchStores = async () => {
        setLoading(true);
        const { data: stores, error } = await supabase
            .from('stores')
            .select(`
                *,
                profiles:owner_id (full_name, email, cedula, cedula_photo_url, selfie_holding_id_url)
            `)
            .eq('approval_status', 'pending')
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching stores:", error);
            toast("Error cargando solicitudes", "error");
        } else {
            setData(stores || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchStores();
    }, []);

    // Actions
    const handleApproval = async (id: string, status: 'approved' | 'rejected') => {
        const { error } = await supabase
            .from('stores')
            .update({ approval_status: status })
            .eq('id', id);

        if (error) {
            toast("Error actualizando estado", "error");
        } else {
            toast(status === 'approved' ? "Tienda aprobada" : "Tienda rechazada", "success");
            fetchStores();
        }
    };

    // Table Config
    const columnHelper = createColumnHelper<Store>();

    const columns = useMemo(() => [
        columnHelper.accessor("name", {
            header: "Tienda",
            cell: (info) => (
                <div className="font-bold text-white">{info.getValue()}</div>
            ),
        }),
        columnHelper.accessor("profiles.full_name", {
            header: "Solicitante",
            cell: (info) => (
                <div>
                    <div className="font-medium text-white">{info.getValue() || "Sin nombre"}</div>
                    <div className="text-xs text-gray-400">{info.row.original.profiles?.email}</div>
                    <div className="text-xs text-brand-red font-mono mt-1">
                        C.I: {info.row.original.profiles?.cedula || "N/A"}
                    </div>
                </div>
            ),
        }),
        columnHelper.display({
            id: "documents",
            header: "Documentos",
            cell: (info) => {
                const profile = info.row.original.profiles;
                return (
                    <div className="flex flex-col gap-2">
                        {profile?.cedula_photo_url ? (
                            <DocumentLink path={profile.cedula_photo_url} label="Ver Cédula" />
                        ) : <span className="text-xs text-gray-600">Sin Cédula</span>}

                        {profile?.selfie_holding_id_url ? (
                            <DocumentLink path={profile.selfie_holding_id_url} label="Ver Selfie" />
                        ) : <span className="text-xs text-gray-600">Sin Selfie</span>}
                    </div>
                );
            }
        }),
        columnHelper.display({
            id: "actions",
            header: "Acciones",
            cell: (info) => (
                <div className="flex gap-2">
                    <button
                        onClick={() => handleApproval(info.row.original.id, 'approved')}
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors text-xs font-bold"
                    >
                        <CheckCircle2 className="w-4 h-4" /> Aprobar
                    </button>
                    <button
                        onClick={() => handleApproval(info.row.original.id, 'rejected')}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-xs font-bold"
                    >
                        <XCircle className="w-4 h-4" /> Rechazar
                    </button>
                </div>
            ),
        }),
    ], []);

    const table = useReactTable({
        data,
        columns,
        state: { globalFilter },
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });

    if (loading) return <div className="text-white flex items-center gap-2"><Loader2 className="animate-spin" /> Cargando solicitudes...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-950 border border-gray-800 p-4 rounded-2xl">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-1">Verificaciones KYC</h1>
                    <p className="text-gray-400 text-sm">Revisa y aprueba las solicitudes de nuevos vendedores.</p>
                </div>
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        value={globalFilter ?? ""}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                        placeholder="Buscar por nombre, cédula..."
                        className="w-full bg-gray-900 border border-gray-700 text-white pl-11 pr-4 py-3 rounded-xl focus:border-brand-red focus:ring-1 focus:ring-brand-red outline-none transition-all placeholder:text-gray-600 text-sm"
                    />
                </div>
            </div>

            {data.length === 0 ? (
                <div className="bg-gray-950 border border-gray-800 rounded-2xl p-12 text-center">
                    <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="w-8 h-8 text-green-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Todo al día</h3>
                    <p className="text-gray-400">No hay solicitudes pendientes de revisión.</p>
                </div>
            ) : (
                <div className="bg-gray-950 border border-gray-800 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-400">
                            <thead className="bg-gray-900 text-gray-200 uppercase font-bold text-xs">
                                {table.getHeaderGroups().map(headerGroup => (
                                    <tr key={headerGroup.id}>
                                        {headerGroup.headers.map(header => (
                                            <th key={header.id} className="px-6 py-4">
                                                {flexRender(header.column.columnDef.header, header.getContext())}
                                            </th>
                                        ))}
                                    </tr>
                                ))}
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {table.getRowModel().rows.map(row => (
                                    <tr key={row.id} className="hover:bg-gray-900/50 transition-colors">
                                        {row.getVisibleCells().map(cell => (
                                            <td key={cell.id} className="px-6 py-4">
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="p-4 border-t border-gray-800 flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                            Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => table.previousPage()}
                                disabled={!table.getCanPreviousPage()}
                                className="p-2 rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => table.nextPage()}
                                disabled={!table.getCanNextPage()}
                                className="p-2 rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function DocumentLink({ path, label }: { path: string, label: string }) {
    const [url, setUrl] = useState<string | null>(null);
    const supabase = createClient();

    useEffect(() => {
        async function getUrl() {
            if (!path) return;
            const { data } = await supabase.storage
                .from('kyc-documents')
                .createSignedUrl(path, 3600); // 1 hour
            if (data) setUrl(data.signedUrl);
        }
        getUrl();
    }, [path, supabase]);

    if (!url) return <span className="text-xs text-gray-500 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Cargando...</span>;

    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 hover:underline"
        >
            <ExternalLink className="w-3 h-3" /> {label}
        </a>
    );
}
