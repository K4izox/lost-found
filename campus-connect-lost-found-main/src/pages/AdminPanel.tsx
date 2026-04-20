import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Package, Users, CheckCircle, Clock, Trash2, Shield,
    FileDown, Activity, Search, Ban, UserCheck, Megaphone,
    BarChart3, Send, X, Flag, Check, Mail
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    PieChart, Pie, Cell, ResponsiveContainer
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { fetchItems, API_BASE_URL as API_BASE } from '@/lib/api';

// Use the same dynamic base URL as the rest of the application
// const API_BASE = 'http://localhost:3000/api';
const getAuth = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` });

const fetchAdminStats = async () => {
    const r = await fetch(`${API_BASE}/admin/stats`, { headers: getAuth() });
    return r.json();
};
const fetchAdminReports = async () => {
    const r = await fetch(`${API_BASE}/admin/reports`, { headers: getAuth() });
    return r.json();
};
const updateReportStatus = async ({ id, status }: { id: string, status: string }) => {
    const r = await fetch(`${API_BASE}/admin/reports/${id}/status`, { method: 'PATCH', headers: getAuth(), body: JSON.stringify({ status }) });
    return r.json();
};
const fetchAdminUsers = async () => {
    const r = await fetch(`${API_BASE}/admin/users`, { headers: getAuth() });
    return r.json();
};
const fetchChartStats = async () => {
    const r = await fetch(`${API_BASE}/admin/chart-stats`, { headers: getAuth() });
    return r.json();
};
const deleteItem = async (id: string) => {
    const r = await fetch(`${API_BASE}/items/${id}`, { method: 'DELETE', headers: getAuth() });
    return r.json();
};
const banUser = async (id: string) => {
    const r = await fetch(`${API_BASE}/admin/users/${id}/ban`, { method: 'PATCH', headers: getAuth() });
    return r.json();
};
const unbanUser = async (id: string) => {
    const r = await fetch(`${API_BASE}/admin/users/${id}/unban`, { method: 'PATCH', headers: getAuth() });
    return r.json();
};
const broadcastNotif = async (payload: { title: string; message: string; sendEmail?: boolean }) => {
    const r = await fetch(`${API_BASE}/admin/broadcast`, {
        method: 'POST', headers: getAuth(), body: JSON.stringify(payload)
    });
    return r.json();
};

const PIE_COLORS = ['#6366f1', '#22d3ee', '#f59e0b', '#10b981', '#f43f5e', '#a855f7'];

const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-popover border border-border rounded-xl shadow-lg px-3 py-2 text-sm">
            <p className="font-semibold text-foreground mb-1">{label}</p>
            {payload.map((p: any) => (
                <p key={p.name} style={{ color: p.fill }} className="font-medium">
                    {p.name}: {p.value}
                </p>
            ))}
        </div>
    );
};

const CustomPieTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const color = payload[0].payload?.fill || payload[0].fill || '#000';
    return (
        <div className="bg-popover border border-border rounded-xl shadow-lg px-3 py-2 text-sm">
            <p className="font-semibold" style={{ color }}>{payload[0].name}</p>
            <p className="text-foreground">{payload[0].value} items</p>
        </div>
    );
};

const renderLegend = (props: any) => {
    const { payload } = props;
    return (
        <ul className="flex justify-center gap-6 pt-3 text-sm font-medium">
            {payload.map((entry: any, index: number) => (
                <li key={`item-${index}`} className="flex items-center gap-1.5">
                    <span className="block w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="text-muted-foreground capitalize">{entry.value}</span>
                </li>
            ))}
        </ul>
    );
};

const AdminPanel = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [itemSearch, setItemSearch] = useState('');
    const [userSearch, setUserSearch] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [broadcastOpen, setBroadcastOpen] = useState(false);
    const [broadcastTitle, setBroadcastTitle] = useState('');
    const [broadcastMsg, setBroadcastMsg] = useState('');
    const [sendEmailBroadcast, setSendEmailBroadcast] = useState(false);
    const [broadcastSuccess, setBroadcastSuccess] = useState('');
    const [reportSearch, setReportSearch] = useState('');

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (!user || user.role !== 'admin') navigate('/');
    }, [navigate]);

    const { data: stats } = useQuery({ queryKey: ['adminStats'], queryFn: fetchAdminStats });
    const { data: users = [] } = useQuery({ queryKey: ['adminUsers'], queryFn: fetchAdminUsers });
    const { data: items = [] } = useQuery({ queryKey: ['items'], queryFn: fetchItems });
    const { data: chartData } = useQuery({ queryKey: ['chartStats'], queryFn: fetchChartStats });
    const { data: reports = [] } = useQuery({ queryKey: ['adminReports'], queryFn: fetchAdminReports });

    const deleteMut = useMutation({ mutationFn: deleteItem, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['items'] }); queryClient.invalidateQueries({ queryKey: ['adminStats'] }); setDeleteConfirm(null); } });
    const banMut = useMutation({ mutationFn: banUser, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminUsers'] }) });
    const unbanMut = useMutation({ mutationFn: unbanUser, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminUsers'] }) });
    const updateReportMut = useMutation({ mutationFn: updateReportStatus, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminReports'] }) });
    const broadcastMut = useMutation({
        mutationFn: broadcastNotif,
        onSuccess: (data) => {
            setBroadcastSuccess(`✅ Successfully sent to ${data.sent} users`);
            setBroadcastTitle(''); setBroadcastMsg('');
            setTimeout(() => { setBroadcastOpen(false); setBroadcastSuccess(''); }, 2000);
        }
    });

    const filteredItems = useMemo(() =>
        items.filter((i: any) =>
            i.title.toLowerCase().includes(itemSearch.toLowerCase()) ||
            i.category.toLowerCase().includes(itemSearch.toLowerCase()) ||
            i.status.toLowerCase().includes(itemSearch.toLowerCase())
        ), [items, itemSearch]);

    const filteredUsers = useMemo(() =>
        users.filter((u: any) =>
            u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
            u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
            u.role.toLowerCase().includes(userSearch.toLowerCase())
        ), [users, userSearch]);

    const filteredReports = useMemo(() =>
        reports.filter((r: any) =>
            r.reason.toLowerCase().includes(reportSearch.toLowerCase()) ||
            r.status.toLowerCase().includes(reportSearch.toLowerCase()) ||
            r.item.title.toLowerCase().includes(reportSearch.toLowerCase())
        ), [reports, reportSearch]);

    const exportPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(18); doc.setTextColor(30, 58, 138);
        doc.text('Campus Connect — Lost & Found Report', 14, 22);
        doc.setFontSize(10); doc.setTextColor(100);
        doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { dateStyle: 'full' })}`, 14, 30);
        if (stats) {
            autoTable(doc, {
                startY: 40,
                head: [['Metric', 'Value']],
                body: [
                    ['Total Users', stats.totalUsers],
                    ['Total Items', stats.totalItems],
                    ['Active', stats.activeItems],
                    ['Claimed', stats.claimedItems],
                    ['Resolved', stats.resolvedItems],
                ],
                theme: 'grid', headStyles: { fillColor: [30, 58, 138] },
            });
        }
        const y = (doc as any).lastAutoTable?.finalY || 100;
        autoTable(doc, {
            startY: y + 10,
            head: [['Title', 'Type', 'Category', 'Status', 'Date']],
            body: items.map((i: any) => [i.title, i.type, i.category, i.status, new Date(i.date).toLocaleDateString('en-US')]),
            theme: 'striped', headStyles: { fillColor: [30, 58, 138] }, styles: { fontSize: 8 },
        });
        doc.save(`campus-connect-report-${Date.now()}.pdf`);
    };

    const exportExcel = () => {
        const wb = XLSX.utils.book_new();
        const wsItems = XLSX.utils.json_to_sheet(items.map((i: any) => ({
            Title: i.title, Type: i.type, Category: i.category, Location: i.location,
            Status: i.status, Date: new Date(i.date).toLocaleDateString('id-ID'),
        })));
        const wsUsers = XLSX.utils.json_to_sheet(users.map((u: any) => ({
            Name: u.name, Email: u.email, Role: u.role,
            Status: u.isBanned ? 'Banned' : 'Active',
            Joined: new Date(u.createdAt).toLocaleDateString('en-US'),
        })));
        XLSX.utils.book_append_sheet(wb, wsItems, 'Items');
        XLSX.utils.book_append_sheet(wb, wsUsers, 'Users');
        XLSX.writeFile(wb, `campus-connect-${Date.now()}.xlsx`);
    };

    const statCards = [
        { label: 'Total Users', value: stats?.totalUsers ?? '...', icon: Users, color: 'text-blue-500' },
        { label: 'Total Items', value: stats?.totalItems ?? '...', icon: Package, color: 'text-purple-500' },
        { label: 'Active Listings', value: stats?.activeItems ?? '...', icon: Clock, color: 'text-yellow-500' },
        { label: 'Resolved / Claimed', value: ((stats?.resolvedItems ?? 0) + (stats?.claimedItems ?? 0)), icon: CheckCircle, color: 'text-green-500' },
    ];

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Header />
            <main className="flex-1 container py-8 space-y-6">

                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Shield className="h-8 w-8 text-primary" />
                        <div>
                            <h1 className="text-3xl font-bold">Admin Panel</h1>
                            <p className="text-muted-foreground text-sm">Manage all platform data</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" onClick={() => setBroadcastOpen(true)} className="flex items-center gap-2">
                            <Megaphone className="h-4 w-4" /> Broadcast
                        </Button>
                        <Button variant="outline" size="sm" onClick={exportExcel} className="flex items-center gap-2">
                            <FileDown className="h-4 w-4" /> Excel
                        </Button>
                        <Button size="sm" onClick={exportPDF} className="flex items-center gap-2 bg-primary">
                            <FileDown className="h-4 w-4" /> PDF
                        </Button>
                    </div>
                </div>

                {/* Broadcast modal */}
                {broadcastOpen && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <Card className="w-full max-w-md">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Megaphone className="h-5 w-5 text-primary" /> Broadcast Notification to All Users
                                </CardTitle>
                                <Button variant="ghost" size="icon" onClick={() => setBroadcastOpen(false)}><X className="h-4 w-4" /></Button>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Input placeholder="Notification title..." value={broadcastTitle} onChange={e => setBroadcastTitle(e.target.value)} />
                                <textarea
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px] resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                                    placeholder="Message content..."
                                    value={broadcastMsg}
                                    onChange={e => setBroadcastMsg(e.target.value)}
                                />
                                
                                <div className="flex items-center space-x-2 py-1">
                                    <Checkbox 
                                        id="sendEmail" 
                                        checked={sendEmailBroadcast} 
                                        onCheckedChange={(checked) => setSendEmailBroadcast(!!checked)} 
                                    />
                                    <Label htmlFor="sendEmail" className="text-sm font-medium leading-none cursor-pointer flex items-center gap-1.5">
                                        <Mail className="h-3.5 w-3.5" /> Send via Email to All Users
                                    </Label>
                                </div>

                                {broadcastSuccess && <p className="text-sm text-green-600 font-medium">{broadcastSuccess}</p>}
                                <Button 
                                    className="w-full" 
                                    onClick={() => broadcastMut.mutate({ 
                                        title: broadcastTitle, 
                                        message: broadcastMsg,
                                        sendEmail: sendEmailBroadcast 
                                    })} 
                                    disabled={!broadcastTitle || !broadcastMsg || broadcastMut.isPending}
                                >
                                    <Send className="h-4 w-4 mr-2" />
                                    {broadcastMut.isPending ? 'Sending Broadcast...' : 'Send to All Users'}
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Stat Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {statCards.map((s, i) => (
                        <Card key={i} className="hover:shadow-md transition-shadow">
                            <CardContent className="pt-5 pb-4">
                                <s.icon className={`h-7 w-7 mb-2 ${s.color}`} />
                                <div className="text-2xl font-bold">{s.value}</div>
                                <div className="text-xs text-muted-foreground">{s.label}</div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Charts */}
                {chartData && (
                    <div className="grid md:grid-cols-2 gap-4">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <BarChart3 className="h-4 w-4" /> Reports — Last 7 Days
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={chartData.daily}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                                        <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                                        <Legend content={renderLegend} />
                                        <Bar dataKey="lost" fill="#f43f5e" name="Lost" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="found" fill="#10b981" name="Found" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <Package className="h-4 w-4" /> Distribution by Category
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={220}>
                                    <PieChart>
                                        <Pie
                                            data={chartData.byCategory}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={80}
                                            stroke="white"
                                            strokeWidth={2}
                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                            labelLine={false}
                                        >
                                            {chartData.byCategory.map((_: any, index: number) => (
                                                <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CustomPieTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Tabs */}
                <Tabs defaultValue="items">
                    <TabsList>
                        <TabsTrigger value="items" className="flex items-center gap-2">
                            <Activity className="h-4 w-4" /> Items ({items.length})
                        </TabsTrigger>
                        <TabsTrigger value="users" className="flex items-center gap-2">
                            <Users className="h-4 w-4" /> Users ({users.length})
                        </TabsTrigger>
                        <TabsTrigger value="reports" className="flex items-center gap-2">
                            <Flag className="h-4 w-4" /> Reports ({reports.length})
                        </TabsTrigger>
                    </TabsList>

                    {/* ── Items Tab ── */}
                    <TabsContent value="items">
                        <Card>
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-2">
                                    <Search className="h-4 w-4 text-muted-foreground" />
                                    <Input placeholder="Search title, category, status..." value={itemSearch} onChange={e => setItemSearch(e.target.value)} className="max-w-sm h-8 text-sm" />
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b bg-muted/50">
                                                <th className="text-left p-3 font-medium">Title</th>
                                                <th className="text-left p-3 font-medium">Type</th>
                                                <th className="text-left p-3 font-medium">Status</th>
                                                <th className="text-left p-3 font-medium">Date</th>
                                                <th className="text-left p-3 font-medium">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredItems.map((item: any) => (
                                                <tr key={item.id} className="border-b hover:bg-muted/30 transition-colors">
                                                    <td className="p-3 font-medium max-w-[180px] truncate">{item.title}</td>
                                                    <td className="p-3"><Badge variant={item.type === 'lost' ? 'destructive' : 'default'} className="text-xs">{item.type}</Badge></td>
                                                    <td className="p-3">
                                                        <Badge variant="secondary" className={`text-xs ${item.status === 'active' ? 'bg-green-100 text-green-800' : item.status === 'resolved' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'}`}>
                                                            {item.status}
                                                        </Badge>
                                                    </td>
                                                    <td className="p-3 text-muted-foreground">{new Date(item.date).toLocaleDateString('en-US')}</td>
                                                    <td className="p-3">
                                                        {deleteConfirm === item.id ? (
                                                            <div className="flex gap-2">
                                                                <Button size="sm" variant="destructive" onClick={() => deleteMut.mutate(item.id)} disabled={deleteMut.isPending}>Delete</Button>
                                                                <Button size="sm" variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
                                                            </div>
                                                        ) : (
                                                            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setDeleteConfirm(item.id)}>
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                            {filteredItems.length === 0 && (
                                                <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No items found</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ── Users Tab ── */}
                    <TabsContent value="users">
                        <Card>
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-2">
                                    <Search className="h-4 w-4 text-muted-foreground" />
                                    <Input placeholder="Search name, email, role..." value={userSearch} onChange={e => setUserSearch(e.target.value)} className="max-w-sm h-8 text-sm" />
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b bg-muted/50">
                                                <th className="text-left p-3 font-medium">Name</th>
                                                <th className="text-left p-3 font-medium">Email</th>
                                                <th className="text-left p-3 font-medium">Role</th>
                                                <th className="text-left p-3 font-medium">Status</th>
                                                <th className="text-left p-3 font-medium">Joined</th>
                                                <th className="text-left p-3 font-medium">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredUsers.map((u: any) => (
                                                <tr key={u.id} className={`border-b hover:bg-muted/30 transition-colors ${u.isBanned ? 'opacity-60' : ''}`}>
                                                    <td className="p-3 font-medium">{u.name}</td>
                                                    <td className="p-3 text-muted-foreground text-xs">{u.email}</td>
                                                    <td className="p-3">
                                                        <Badge variant={u.role === 'admin' ? 'default' : 'secondary'} className="text-xs capitalize">{u.role}</Badge>
                                                    </td>
                                                    <td className="p-3">
                                                        {u.isBanned
                                                            ? <Badge variant="destructive" className="text-xs">Banned</Badge>
                                                            : <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">Active</Badge>
                                                        }
                                                    </td>
                                                    <td className="p-3 text-muted-foreground">{new Date(u.createdAt).toLocaleDateString('en-US')}</td>
                                                    <td className="p-3">
                                                        {u.isBanned ? (
                                                            <Button size="sm" variant="outline" className="text-green-600 border-green-300 hover:bg-green-50 flex items-center gap-1" onClick={() => unbanMut.mutate(u.id)} disabled={unbanMut.isPending}>
                                                                <UserCheck className="h-3 w-3" /> Unban
                                                            </Button>
                                                        ) : u.role !== 'admin' ? (
                                                            <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10 flex items-center gap-1" onClick={() => banMut.mutate(u.id)} disabled={banMut.isPending}>
                                                                <Ban className="h-3 w-3" /> Ban
                                                            </Button>
                                                        ) : null}
                                                    </td>
                                                </tr>
                                            ))}
                                            {filteredUsers.length === 0 && (
                                                <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No users found</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ── Reports Tab ── */}
                    <TabsContent value="reports">
                        <Card>
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-2">
                                    <Search className="h-4 w-4 text-muted-foreground" />
                                    <Input placeholder="Search reasons, status, item..." value={reportSearch} onChange={e => setReportSearch(e.target.value)} className="max-w-sm h-8 text-sm" />
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b bg-muted/50">
                                                <th className="text-left p-3 font-medium">Item</th>
                                                <th className="text-left p-3 font-medium">Reporter</th>
                                                <th className="text-left p-3 font-medium">Reason</th>
                                                <th className="text-left p-3 font-medium min-w-[200px]">Details</th>
                                                <th className="text-left p-3 font-medium">Status</th>
                                                <th className="text-left p-3 font-medium text-center">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredReports.map((r: any) => (
                                                <tr key={r.id} className="border-b hover:bg-muted/30 transition-colors">
                                                    <td className="p-3 font-medium max-w-[150px] truncate"><div className="text-xs text-muted-foreground capitalize">{r.item.type}</div>{r.item.title}</td>
                                                    <td className="p-3 truncate max-w-[150px]"><div className="text-xs text-muted-foreground">{r.reporter.email}</div>{r.reporter.name}</td>
                                                    <td className="p-3 capitalize">{r.reason}</td>
                                                    <td className="p-3 max-w-[250px] truncate text-xs text-muted-foreground" title={r.description}>{r.description || '-'}</td>
                                                    <td className="p-3">
                                                        <Badge variant="secondary" className={`text-xs ${r.status === 'pending' ? 'bg-amber-100 text-amber-800 border border-amber-200' : r.status === 'reviewed' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-gray-100 text-gray-700'}`}>
                                                            {r.status}
                                                        </Badge>
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        <div className="flex justify-center gap-2">
                                                            {r.status === 'pending' ? (
                                                                <>
                                                                    <Button variant="outline" size="sm" onClick={() => updateReportMut.mutate({ id: r.id, status: 'reviewed' })} disabled={updateReportMut.isPending} className="h-8 bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100"><Check className="h-4 w-4 lg:mr-1" /> <span className="hidden lg:inline">Review</span></Button>
                                                                    <Button variant="outline" size="sm" onClick={() => updateReportMut.mutate({ id: r.id, status: 'dismissed' })} disabled={updateReportMut.isPending} className="h-8 bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"><Ban className="h-4 w-4 lg:mr-1" /> <span className="hidden lg:inline">Dismiss</span></Button>
                                                                </>
                                                            ) : (
                                                                <span className="text-xs text-muted-foreground italic flex items-center justify-center gap-1">
                                                                    {r.status === 'reviewed' ?
                                                                        <><Check className="h-3 w-3" /> Reviewed</> :
                                                                        <><Ban className="h-3 w-3" /> Dismissed</>
                                                                    }
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {filteredReports.length === 0 && (
                                                <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No reports found</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </main>
            <Footer />
        </div>
    );
};

export default AdminPanel;
