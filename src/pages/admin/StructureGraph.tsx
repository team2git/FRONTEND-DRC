import { useState, useEffect } from 'react';
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { getOrganizations } from '../../api/organizationService';
import { getDepartments, Department } from '../../api/departmentService';
import { getTeams, Team } from '../../api/teamService';
import api from '../../api/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Building2, Layers, Briefcase, Users, Info, X } from 'lucide-react';

const DiamondBackground = () => (
    <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        {/* Mesh Gradient Base */}
        <div className="absolute inset-0 bg-slate-100 dark:bg-[#0A0A0B]" />

        {/* Floating Glassy Diamonds */}
        {[...Array(10)].map((_, i) => (
            <motion.div
                key={i}
                initial={{
                    opacity: 0,
                    rotate: 45,
                    x: Math.random() * 100 + "%",
                    y: Math.random() * 100 + "%"
                }}
                animate={{
                    opacity: [0.15, 0.45, 0.15],
                    y: ["-20%", "120%"],
                    rotate: [45, 225],
                }}
                transition={{
                    duration: 20 + Math.random() * 20,
                    repeat: Infinity,
                    ease: "linear",
                    delay: i * -4
                }}
                className="absolute h-64 w-64 rounded-[48px] border border-white/40 bg-white/10 backdrop-blur-3xl dark:border-white/10 dark:bg-white/[0.04]"
                style={{
                    left: `${(i * 12) % 95}%`,
                }}
            />
        ))}

    </div>
);

// Interfaces
interface Organization {
    id: string;
    name: string;
    type: string;
    parentId?: string | { id: string; name: string } | null;
}

interface Sector {
    id: string;
    name: string;
    organizationId: string;
}

// Tree Node Types
interface TeamNode {
    type: 'team';
    data: Team;
}

interface DeptNode {
    type: 'department';
    data: Department;
    children: TeamNode[];
}

interface SectorNode {
    type: 'sector';
    data: Sector;
    children: DeptNode[];
}

interface OrgNode {
    type: 'organization';
    data: Organization;
    children: (OrgNode | SectorNode | DeptNode)[];
}

// Union type for all nodes
type TreeNodeType = OrgNode | SectorNode | DeptNode | TeamNode;

const TreeNode = ({ node, level = 0, onTeamClick }: { node: TreeNodeType; level?: number; onTeamClick: (team: Team) => void }) => {
    const [isOpen, setIsOpen] = useState(true);

    const hasChildren = 'children' in node && Array.isArray(node.children) && node.children.length > 0;

    const getIcon = (type: string) => {
        switch (type) {
            case 'organization': return <Building2 size={18} />;
            case 'sector': return <Layers size={18} />;
            case 'department': return <Briefcase size={18} />;
            case 'team': return <Users size={18} />;
            default: return null;
        }
    };

    const getTheme = (type: string) => {
        switch (type) {
            case 'organization': return 'border-blue-200 bg-blue-50/50 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300';
            case 'sector': return 'border-purple-200 bg-purple-50/50 text-purple-700 dark:border-purple-500/20 dark:bg-purple-500/10 dark:text-purple-300';
            case 'department': return 'border-emerald-200 bg-emerald-50/50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300';
            case 'team': return 'border-amber-200 bg-amber-50/50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300 hover:scale-[1.01]';
            default: return 'border-slate-200 bg-slate-50 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-white';
        }
    };

    const getLabel = (type: string) => {
        switch (type) {
            case 'organization': return 'Organization';
            case 'sector': return 'Sector';
            case 'department': return 'Department';
            case 'team': return 'Team';
            default: return '';
        }
    };

    return (
        <div className="flex flex-col">
            <motion.div
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`group relative flex items-center p-3 mb-3 rounded-2xl border backdrop-blur-xl transition-all duration-300 ${getTheme(node.type)}`}
                style={{ marginLeft: `${level * 32}px` }}
                onClick={() => node.type === 'team' ? onTeamClick(node.data) : setIsOpen(!isOpen)}
            >
                {/* Connection Line */}
                {level > 0 && (
                    <div className="absolute -left-[16px] top-1/2 h-[2px] w-[16px] bg-slate-300/50 dark:bg-white/10" />
                )}

                <div className="flex items-center gap-4 w-full">
                    {hasChildren ? (
                        <div className={`transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`}>
                            <ChevronRight size={18} className="opacity-50" />
                        </div>
                    ) : (
                        <div className="w-[18px]" />
                    )}

                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/50 shadow-sm backdrop-blur-md dark:bg-white/5`}>
                        {getIcon(node.type)}
                    </div>

                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">
                            {getLabel(node.type)}
                        </span>
                        <span className="font-bold text-slate-900 truncate dark:text-white">
                            {node.data.name}
                        </span>
                    </div>

                    {node.type === 'team' && (
                        <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="flex items-center gap-1.5 rounded-full bg-white/40 px-3 py-1 text-xs font-semibold backdrop-blur-md dark:bg-white/10">
                                <Info size={12} /> View Details
                            </span>
                        </div>
                    )}

                    {node.type === 'organization' && (
                        <span className="ml-auto rounded-lg bg-blue-600/10 px-2 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                            {node.data.type?.replace('_', ' ') || 'Sub'}
                        </span>
                    )}
                </div>
            </motion.div>

            <AnimatePresence>
                {hasChildren && isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="relative overflow-hidden"
                    >
                        {/* Vertical connection line */}
                        <div
                            className="absolute bottom-6 top-0 w-[2px] bg-slate-300/50 dark:bg-white/10"
                            style={{ left: `${(level * 32) + 20}px` }}
                        />

                        <div>
                            {(node as any).children.map((child: TreeNodeType, idx: number) => (
                                <TreeNode
                                    key={((child.data as any).id || (child.data as any)._id || idx) + child.type}
                                    node={child}
                                    level={level + 1}
                                    onTeamClick={onTeamClick}
                                />
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// Simple Modal Component
const TeamDetailsModal = ({ team, onClose }: { team: Team | null; onClose: () => void }) => {
    return (
        <AnimatePresence>
            {team && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-xl overflow-hidden rounded-[32px] border border-white/40 bg-white/80 p-8 shadow-2xl backdrop-blur-3xl dark:border-white/10 dark:bg-[#1C1C1E]/80"
                    >
                        <div className="mb-8 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
                                    <Users size={24} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{team.name}</h3>
                                    <p className="text-sm text-slate-500 dark:text-white/40">Team Structural Details</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition-all hover:bg-slate-200 dark:bg-white/5 dark:text-white/40"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-8">
                            {team.description && (
                                <div className="rounded-2xl bg-white/40 p-4 dark:bg-white/5">
                                    <h4 className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">Description</h4>
                                    <p className="text-slate-600 dark:text-white/70">{team.description}</p>
                                </div>
                            )}

                            <div>
                                <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-400">Team Leadership</h4>
                                {team.teamLeader ? (
                                    <div className="flex items-center gap-4 rounded-2xl border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-500/20 dark:bg-blue-500/10">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white font-bold">
                                            {team.teamLeader.fullname?.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 dark:text-white">{team.teamLeader.fullname}</p>
                                            <p className="text-sm text-slate-500 dark:text-white/40">{team.teamLeader.email}</p>
                                        </div>
                                        <div className="ml-auto rounded-lg bg-blue-600 px-3 py-1 text-[10px] font-bold text-white uppercase tracking-wider">
                                            Leader
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-center text-sm italic text-slate-400 py-4 border-2 border-dashed border-slate-100 rounded-2xl">No leader assigned</p>
                                )}
                            </div>

                            <div>
                                <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-400">Active Members ({team.members?.length || 0})</h4>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    {team.members?.map((member: any) => (
                                        <div key={member.id || member._id} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white/40 p-3 dark:border-white/5 dark:bg-white/5">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold dark:bg-white/10 dark:text-white/60">
                                                {member.fullname?.charAt(0)}
                                            </div>
                                            <div className="overflow-hidden">
                                                <p className="truncate text-xs font-bold text-slate-900 dark:text-white">{member.fullname}</p>
                                                <p className="truncate text-[10px] text-slate-400">{member.email}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {(!team.members || team.members.length === 0) && (
                                        <div className="col-span-full py-8 text-center text-sm italic text-slate-400">No members found</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end">
                            <button
                                onClick={onClose}
                                className="rounded-2xl bg-slate-900 px-8 py-3 text-sm font-bold text-white shadow-xl transition-all hover:bg-slate-800 active:scale-95 dark:bg-white dark:text-slate-900"
                            >
                                Done
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default function StructureGraph() {
    const [treeData, setTreeData] = useState<OrgNode[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

    useEffect(() => {
        buildTree();
    }, []);

    const buildTree = async () => {
        setLoading(true);
        setError(null);
        try {
            console.log("Fetching structure data...");
            // Use services where possible to handle response unwrapping
            const [orgsData, sectorsRes, deptsData, teamsData] = await Promise.all([
                getOrganizations(),
                api.get('/sectors'),
                getDepartments(),
                getTeams()
            ]);

            // Normalize Data
            const orgs: Organization[] = Array.isArray(orgsData) ? orgsData : (orgsData as any).data || [];
            const sectors: Sector[] = Array.isArray(sectorsRes.data) ? sectorsRes.data : [];
            const depts: Department[] = Array.isArray(deptsData) ? deptsData : [];
            const teams: Team[] = Array.isArray(teamsData) ? teamsData : [];

            // Helper to get ID from object or string
            const getId = (obj: any): string | null => {
                if (!obj) return null;
                if (typeof obj === 'string') return obj;
                if (typeof obj === 'object' && obj.id) return obj.id;
                if (typeof obj === 'object' && obj._id) return obj._id;
                return null;
            };

            // Recursive function to build organization node
            const buildOrgNode = (org: Organization): OrgNode => {
                // 1. Find Sub-Organizations (Branches)
                const childOrgs = orgs.filter(o => {
                    const parentId = getId(o.parentId);
                    return parentId === org.id;
                });
                const childOrgNodes = childOrgs.map(childOrg => buildOrgNode(childOrg));

                // 2. Find Sectors
                const orgSectors = sectors.filter(s => {
                    // Try multiple ways to get the organization ID
                    const sAny = s as any;
                    const sOrgId = getId(s.organizationId) || getId(sAny.organization);
                    const isMatch = sOrgId === org.id;
                    if (isMatch) console.log(`Matched Sector ${s.name} to Org ${org.name}`);
                    return isMatch;
                });

                console.log(`Org: ${org.name}, Sectors Found: ${orgSectors.length}`);

                // 3. Build Sector Nodes (finding Departments from GLOBAL list)
                const sectorNodes: SectorNode[] = orgSectors.map(sector => {
                    // Find Departments for this Sector from GLOBAL list
                    const sectorDepts = depts.filter(d => {
                        const dAny = d as any;
                        const sId = getId(dAny.sectorId) || getId(dAny.sector);
                        return sId === sector.id;
                    });

                    const deptNodes: DeptNode[] = sectorDepts.map(dept => buildDeptNode(dept));

                    return {
                        type: 'sector',
                        data: sector,
                        children: deptNodes
                    };
                });

                // 4. Find Direct Departments (those associated with Org but NOT any Sector)
                // We search global depts for those matching Org ID, then exclude those we already found in sectors
                const assignedDeptIds = new Set<string>();
                sectorNodes.forEach(s => s.children.forEach(d => assignedDeptIds.add(d.data.id)));

                const directDepts = depts.filter(d => {
                    const dAny = d as any;
                    const orgId = getId(d.organizationId) || getId(dAny.organization);
                    // Must match Org AND not be in a sector we just processed
                    // (Note: if a dept has a sector that belongs to ANOTHER org, it won't be in assignedDeptIds,
                    // but we should technically exclude it if it has ANY sector. User implies strict hierarchy.)
                    const hasSector = getId(dAny.sectorId) || getId(dAny.sector);

                    return orgId === org.id && !hasSector;
                });

                const directDeptNodes: DeptNode[] = directDepts.map(dept => buildDeptNode(dept));

                // Combine all children
                const children = [...sectorNodes, ...directDeptNodes, ...childOrgNodes];

                return {
                    type: 'organization',
                    data: org,
                    children: children
                };
            };

            const buildDeptNode = (dept: Department): DeptNode => {
                const deptTeams = teams.filter(t => getId(t.department) === dept.id);
                const teamNodes: TeamNode[] = deptTeams.map(t => ({
                    type: 'team',
                    data: t
                }));

                return {
                    type: 'department',
                    data: dept,
                    children: teamNodes
                };
            };

            // Start with Root Organizations (parentId is null or undefined)
            const rootOrgs = orgs.filter(o => !getId(o.parentId));
            const rootNodes = rootOrgs.map(org => buildOrgNode(org));

            setTreeData(rootNodes);

        } catch (error: any) {
            console.error('Failed to build organization tree', error);
            setError(error.message || "Failed to load hierarchy data");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <PageMeta
                title="Structure Graph | IDRMIS"
                description="Organization Structure Hierarchy"
            />
            <PageBreadcrumb pageTitle="Structure Graph" />

            <div className="relative space-y-8 pb-10">
                <DiamondBackground />

                {/* Main Content Area */}
                <div className="rounded-[40px] border border-white/40 bg-white/20 p-8 shadow-2xl backdrop-blur-3xl dark:border-white/10 dark:bg-white/5 lg:p-12">
                    <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h3 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                                Structural Overview
                            </h3>
                            <p className="mt-2 text-slate-500 dark:text-white/40 max-w-lg">
                                Interactive visual map of the entire organizational hierarchy, departments, and tactical teams.
                            </p>
                        </div>
                        <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-blue-600/10 text-blue-600 dark:bg-primary/10 dark:text-primary">
                            <Layers size={28} />
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex h-80 items-center justify-center">
                            <div className="relative">
                                <div className="h-20 w-20 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600 dark:border-white/10 dark:border-t-primary" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="h-10 w-10 animate-pulse rounded-full bg-blue-600/20 dark:bg-primary/20" />
                                </div>
                            </div>
                        </div>
                    ) : error ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="rounded-3xl border border-red-200 bg-red-50 p-12 text-center dark:border-red-500/20 dark:bg-red-500/10"
                        >
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-500/20">
                                <X size={32} />
                            </div>
                            <h4 className="text-xl font-bold text-red-900 dark:text-red-400">Connection Error</h4>
                            <p className="mt-2 text-red-600 dark:text-red-300/70">{error}</p>
                            <button
                                onClick={buildTree}
                                className="mt-6 rounded-2xl bg-red-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-red-700 active:scale-95"
                            >
                                Retry Connection
                            </button>
                        </motion.div>
                    ) : (
                        <div className="rounded-3xl border border-white/20 bg-white/30 p-4 dark:border-white/5 dark:bg-black/20">
                            <div className="max-h-[70vh] overflow-y-auto px-4 py-8 custom-scrollbar">
                                {treeData.length === 0 ? (
                                    <div className="flex h-60 flex-col items-center justify-center text-slate-400">
                                        <Building2 size={48} className="mb-4 opacity-20" />
                                        <p className="font-medium">No organizational data mapped</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {treeData.map(node => (
                                            <TreeNode
                                                key={node.data.id}
                                                node={node}
                                                onTeamClick={setSelectedTeam}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <TeamDetailsModal
                team={selectedTeam}
                onClose={() => setSelectedTeam(null)}
            />
        </>
    );
}
