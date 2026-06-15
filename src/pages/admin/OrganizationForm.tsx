import React, { useState, useEffect } from 'react';
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import { Organization, getOrganizations } from '../../api/organizationService';

interface OrganizationFormProps {
    initialData?: Organization | null;
    isViewMode?: boolean;
    onSave: (data: any) => Promise<void>;
    onCancel: () => void;
}

export const OrganizationForm: React.FC<OrganizationFormProps> = ({ initialData, isViewMode = false, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        name: '',
        type: 'head_office',
        parentId: ''
    });
    const [loading, setLoading] = useState(false);
    const [organizations, setOrganizations] = useState<Organization[]>([]);

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name,
                type: initialData.type,
                parentId: initialData.parentId || ''
            });
        }
        fetchOrganizations();
    }, [initialData]);

    const fetchOrganizations = async () => {
        try {
            const data = await getOrganizations();
            setOrganizations(data);
        } catch (error) {
            console.error("Failed to fetch organizations for parent selection", error);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isViewMode) return;
        setLoading(true);
        try {
            // Convert empty parentId to null
            const submissionData = {
                ...formData,
                parentId: formData.parentId === '' ? null : formData.parentId
            };
            await onSave(submissionData);
        } catch (error) {
            console.error("Error submitting form", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
                <Label>Organization Name</Label>
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
                <Label>Type</Label>
                <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    disabled={isViewMode}
                    className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-gray-800 dark:text-white dark:focus:border-primary"
                >
                    <option value="head_office">Head Office</option>
                    <option value="branch">Branch</option>
                    <option value="subcity">Subcity</option>
                    <option value="woreda">Woreda</option>
                </select>
            </div>

            <div>
                <Label>Parent Organization (Optional)</Label>
                <select
                    name="parentId"
                    value={formData.parentId}
                    onChange={handleChange}
                    disabled={isViewMode}
                    className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-gray-800 dark:text-white dark:focus:border-primary"
                >
                    <option value="">None</option>
                    {organizations
                        .filter(org => org.id !== initialData?.id) // Prevent selecting self as parent
                        .map(org => (
                            <option key={org.id} value={org.id}>
                                {org.name} ({org.type})
                            </option>
                        ))}
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
