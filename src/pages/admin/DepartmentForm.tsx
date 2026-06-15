import React, { useState, useEffect } from 'react';
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import { Department } from '../../api/departmentService';
import { Organization, getOrganizations } from '../../api/organizationService';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

interface Sector {
    id: string;
    name: string;
    organizationId: string;
}

interface DepartmentFormProps {
    initialData?: Department | null;
    isViewMode?: boolean;
    onSave: (data: any) => Promise<void>;
    onCancel: () => void;
}

export const DepartmentForm: React.FC<DepartmentFormProps> = ({ initialData, isViewMode = false, onSave, onCancel }) => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        organizationId: '',
        sectorId: '',
        description: '',
        status: 'active'
    });
    const [loading, setLoading] = useState(false);
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [sectors, setSectors] = useState<Sector[]>([]);
    const [selectedOrgType, setSelectedOrgType] = useState<string>('');

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name,
                organizationId: initialData.organizationId,
                sectorId: (initialData as any).sectorId || '',
                description: (initialData as any).description || '',
                status: (initialData as any).status || 'active'
            });

            // Set organization type if available
            if ((initialData as any).organization) {
                setSelectedOrgType((initialData as any).organization.type);
            }
        } else {
            // NEW: If creating new and user is Branch Admin, pre-fill
            const isBranchAdmin = user?.accessLevel === 'branch_admin' ||
                user?.roles?.some(r => ['Branch Admin', 'branch_admin'].includes(r.name));

            const isSuperAdmin = user?.accessLevel === 'super_admin' ||
                user?.roles?.some(r => ['Super Admin', 'super_admin'].includes(r.name));

            if (isBranchAdmin && !isSuperAdmin && user?.organization) {
                // Pre-fill organization logic handled in fetchOrganizations primarily to ensure it's in the list
                // But we can set formData here if we trust user.organization id
            }
        }
        fetchOrganizations();
    }, [initialData, user]);

    useEffect(() => {
        if (formData.organizationId) {
            fetchSectorsByOrg(formData.organizationId);
        } else {
            setSectors([]);
        }
    }, [formData.organizationId]);

    const fetchOrganizations = async () => {
        try {
            const data = await getOrganizations();

            const isBranchAdmin = user?.accessLevel === 'branch_admin' ||
                user?.roles?.some(r => ['Branch Admin', 'branch_admin'].includes(r.name));

            const isSuperAdmin = user?.accessLevel === 'super_admin' ||
                user?.roles?.some(r => ['Super Admin', 'super_admin'].includes(r.name));

            if (isBranchAdmin && !isSuperAdmin && user?.organization) {
                const orgId = (user.organization as any)._id || (user.organization as any).id || user.organization;
                const filtered = data.filter((o: any) => o.id === orgId || o._id === orgId);
                setOrganizations(filtered);

                // Auto-select if not editing existing
                if (!initialData) {
                    const myOrg = filtered[0];
                    if (myOrg) {
                        setFormData(prev => ({ ...prev, organizationId: myOrg.id }));
                        setSelectedOrgType(myOrg.type);
                    }
                }
            } else {
                setOrganizations(data);
            }
        } catch (error) {
            console.error("Failed to fetch organizations", error);
        }
    };

    const fetchSectorsByOrg = async (orgId: string) => {
        try {
            const response = await api.get(`/sectors/organization/${orgId}`);
            setSectors(response.data);
        } catch (error) {
            console.error("Failed to fetch sectors", error);
            setSectors([]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        if (name === 'organizationId') {
            const selectedOrg = organizations.find(org => org.id === value);
            setSelectedOrgType(selectedOrg?.type || '');

            // Clear sector if changing organization
            setFormData({ ...formData, organizationId: value, sectorId: '' });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isViewMode) return;
        setLoading(true);
        try {
            // Only include sectorId if organization is head_office
            const dataToSave = {
                ...formData,
                sectorId: selectedOrgType === 'head_office' ? formData.sectorId || null : null
            };
            await onSave(dataToSave);
        } catch (error) {
            console.error("Error submitting form", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
                <Label>Department Name *</Label>
                <Input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    disabled={isViewMode}
                />
            </div>

            <div>
                <Label>Organization *</Label>
                <select
                    name="organizationId"
                    value={formData.organizationId}
                    onChange={handleChange}
                    required
                    disabled={isViewMode || (organizations.length === 1 && !isViewMode && user?.accessLevel === 'branch_admin')}
                    className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-gray-800 dark:text-white dark:focus:border-primary"
                >
                    <option value="">Select Organization</option>
                    {organizations.map(org => (
                        <option key={org.id} value={org.id}>
                            {org.name} ({org.type})
                        </option>
                    ))}
                </select>

                {/* Show organization type info */}
                {selectedOrgType && (
                    <div className="mt-2 p-2 rounded-md bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                            <span className="font-semibold">Organization Type: </span>
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${selectedOrgType === 'head_office'
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                                : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                }`}>
                                {selectedOrgType}
                            </span>
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                            {selectedOrgType === 'head_office'
                                ? '📋 Head Office can have sectors. You can assign this department to a sector or directly to the organization.'
                                : '🏢 Branch departments are directly connected to the organization (no sectors).'}
                        </p>
                    </div>
                )}
            </div>

            {/* Show Sector dropdown only for head_office organizations */}
            {selectedOrgType === 'head_office' && (
                <div>
                    <Label>Sector (Optional for Head Office)</Label>
                    <select
                        name="sectorId"
                        value={formData.sectorId}
                        onChange={handleChange}
                        disabled={isViewMode}
                        className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-gray-800 dark:text-white dark:focus:border-primary"
                    >
                        <option value="">No Sector (Direct to Organization)</option>
                        {sectors.map(sector => (
                            <option key={sector.id} value={sector.id}>
                                {sector.name}
                            </option>
                        ))}
                    </select>
                    {sectors.length === 0 && formData.organizationId && (
                        <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                            ⚠️ No sectors available for this organization. The department will be directly connected to the organization.
                        </p>
                    )}
                    {sectors.length > 0 && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            💡 Select a sector to organize this department under it, or leave empty for direct connection to the organization.
                        </p>
                    )}
                </div>
            )}

            <div>
                <Label>Description</Label>
                <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    disabled={isViewMode}
                    className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-gray-800 dark:text-white dark:focus:border-primary"
                />
            </div>

            <div>
                <Label>Status</Label>
                <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    disabled={isViewMode}
                    className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-gray-800 dark:text-white dark:focus:border-primary"
                >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                </select>
            </div>

            <div className="flex items-center gap-3 mt-4 justify-end">
                <Button size="sm" variant="outline" onClick={onCancel} type="button">
                    {isViewMode ? 'Close' : 'Cancel'}
                </Button>
                {!isViewMode && (
                    <Button size="sm" type="submit" disabled={loading}>
                        {loading ? 'Saving...' : 'Save'}
                    </Button>
                )}
            </div>
        </form>
    );
};
