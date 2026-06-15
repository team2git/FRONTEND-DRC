import React, { useState, useEffect } from 'react';
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import { Permission } from '../../api/permissionService';

interface PermissionFormProps {
    initialData?: Permission | null;
    onSave: (data: any) => Promise<void>;
    onCancel: () => void;
}

export const PermissionForm: React.FC<PermissionFormProps> = ({ initialData, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        name: '',
        resource: '',
        action: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name,
                resource: initialData.resource,
                action: initialData.action
            });
        }
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave(formData);
        } catch (error) {
            console.error("Error submitting form", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 px-2 pb-2">
            <div className="space-y-1">
                <Label className="text-sm font-semibold text-slate-700 dark:text-white/80">Permission Name</Label>
                <Input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Create Woreda Profile"
                    className="h-12 bg-slate-50 border-slate-200 focus:bg-white dark:bg-white/5 dark:border-white/10 dark:focus:bg-white/[0.08] transition-all"
                />
                <p className="text-[10px] text-slate-400 mt-1 pl-1 font-medium">A human-readable name for this permission.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                    <Label className="text-sm font-semibold text-slate-700 dark:text-white/80">Resource (Table)</Label>
                    <Input
                        type="text"
                        name="resource"
                        value={formData.resource}
                        onChange={handleChange}
                        required
                        placeholder="e.g. WoredaProfile"
                        className="h-12 bg-slate-50 border-slate-200 focus:bg-white dark:bg-white/5 dark:border-white/10 dark:focus:bg-white/[0.08] transition-all"
                    />
                    <p className="text-[10px] text-slate-400 mt-1 pl-1 font-medium">The system resource or table being protected.</p>
                </div>
                <div className="space-y-1">
                    <Label className="text-sm font-semibold text-slate-700 dark:text-white/80">Action</Label>
                    <Input
                        type="text"
                        name="action"
                        value={formData.action}
                        onChange={handleChange}
                        required
                        placeholder="e.g. create"
                        className="h-12 bg-slate-50 border-slate-200 focus:bg-white dark:bg-white/5 dark:border-white/10 dark:focus:bg-white/[0.08] transition-all"
                    />
                    <p className="text-[10px] text-slate-400 mt-1 pl-1 font-medium">The type of operation (create, read, update, delete).</p>
                </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-center gap-3 mt-8 justify-end">
                <Button variant="outline" onClick={onCancel} type="button" className="w-full sm:w-auto rounded-xl px-6 h-11">
                    Cancel
                </Button>
                <Button type="submit" disabled={loading} className="w-full sm:w-auto rounded-xl px-10 h-11 shadow-lg shadow-primary/20">
                    {loading ? 'Processing...' : (initialData ? 'Update Permission' : 'Create Permission')}
                </Button>
            </div>
        </form>
    );
};
