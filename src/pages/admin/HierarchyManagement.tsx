import React, { useState, useEffect } from 'react';
import PageMeta from '../../components/common/PageMeta';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import { useHierarchy } from '../../context/HierarchyContext';
import {
    getSubordinates,
    delegateAuthority,
    revokeDelegation,
    getDelegationHistory
} from '../../api/hierarchyService';
import { AccessLevelBadge, DirectorateAndAbove } from '../../components/auth/AccessControl';
import Button from '../../components/ui/button/Button';
import { useModal } from '../../hooks/useModal';
import { Modal } from '../../components/ui/modal';
import Label from '../../components/form/Label';

export default function HierarchyManagement() {
    const {
        accessLevel,
        organizationType,
        reportsTo,
        delegatedBy,
        delegatedAuthority,
        managedDepartments,
        managedTeams,
        organization,
        department,
        team
    } = useHierarchy();

    const [subordinates, setSubordinates] = useState<any[]>([]);
    const [delegationHistory, setDelegationHistory] = useState<any>({ delegatedBy: [], delegatedTo: [] });
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<any>(null);

    const { isOpen, openModal, closeModal } = useModal();

    const [delegationForm, setDelegationForm] = useState({
        canManageTeams: false,
        canManageDepartments: false,
        canApproveReports: false,
        reason: '',
        endDate: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [subs, history] = await Promise.all([
                getSubordinates(),
                getDelegationHistory()
            ]);
            setSubordinates(subs || []);
            setDelegationHistory(history);
        } catch (error) {
            console.error('Failed to fetch hierarchy data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDelegateModal = (user: any) => {
        setSelectedUser(user);
        setDelegationForm({
            canManageTeams: false,
            canManageDepartments: false,
            canApproveReports: false,
            reason: '',
            endDate: ''
        });
        openModal();
    };

    const handleDelegate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;

        try {
            await delegateAuthority({
                delegateeId: selectedUser._id || selectedUser.id,
                authority: {
                    canManageTeams: delegationForm.canManageTeams,
                    canManageDepartments: delegationForm.canManageDepartments,
                    canApproveReports: delegationForm.canApproveReports
                },
                reason: delegationForm.reason,
                endDate: delegationForm.endDate ? new Date(delegationForm.endDate) : undefined
            });

            closeModal();
            fetchData();
            alert('Authority delegated successfully');
        } catch (error: any) {
            console.error('Failed to delegate authority', error);
            alert(error.response?.data?.message || 'Failed to delegate authority');
        }
    };

    const handleRevoke = async (userId: string) => {
        if (confirm('Are you sure you want to revoke this delegation?')) {
            try {
                await revokeDelegation(userId);
                fetchData();
                alert('Delegation revoked successfully');
            } catch (error) {
                console.error('Failed to revoke delegation', error);
                alert('Failed to revoke delegation');
            }
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center h-screen">Loading...</div>;
    }

    return (
        <>
            <PageMeta
                title="Hierarchy Management | IDRMIS"
                description="Manage organizational hierarchy and delegations"
            />
            <PageBreadcrumb pageTitle="Hierarchy Management" />

            {/* My Hierarchy Info */}
            <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
                    My Hierarchy Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Access Level</p>
                        <div className="mt-1">
                            <AccessLevelBadge level={accessLevel} />
                        </div>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Organization Type</p>
                        <p className="mt-1 font-medium text-black dark:text-white capitalize">
                            {organizationType.replace('_', ' ')}
                        </p>
                    </div>
                    {organization && (
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Organization</p>
                            <p className="mt-1 font-medium text-black dark:text-white">{organization.name}</p>
                        </div>
                    )}
                    {department && (
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Department</p>
                            <p className="mt-1 font-medium text-black dark:text-white">{department.name}</p>
                        </div>
                    )}
                    {team && (
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Team</p>
                            <p className="mt-1 font-medium text-black dark:text-white">{team.name}</p>
                        </div>
                    )}
                    {reportsTo && (
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Reports To</p>
                            <p className="mt-1 font-medium text-black dark:text-white">{reportsTo.fullname}</p>
                        </div>
                    )}
                    {managedDepartments && managedDepartments.length > 0 && (
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Managed Departments</p>
                            <p className="mt-1 font-medium text-black dark:text-white">
                                {managedDepartments.length} department(s)
                            </p>
                        </div>
                    )}
                    {managedTeams && managedTeams.length > 0 && (
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Managed Teams</p>
                            <p className="mt-1 font-medium text-black dark:text-white">
                                {managedTeams.length} team(s)
                            </p>
                        </div>
                    )}
                </div>

                {delegatedBy && (
                    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                            You have delegated authority from {delegatedBy.fullname}
                        </p>
                        <div className="mt-2 flex gap-2">
                            {delegatedAuthority.canManageTeams && (
                                <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-800 rounded">Can Manage Teams</span>
                            )}
                            {delegatedAuthority.canManageDepartments && (
                                <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-800 rounded">Can Manage Departments</span>
                            )}
                            {delegatedAuthority.canApproveReports && (
                                <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-800 rounded">Can Approve Reports</span>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Subordinates */}
            <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
                    My Subordinates ({subordinates.length})
                </h3>
                <div className="max-w-full overflow-x-auto">
                    <table className="w-full table-auto">
                        <thead>
                            <tr className="bg-gray-2 text-left dark:bg-meta-4">
                                <th className="px-4 py-4 font-medium text-black dark:text-white">Name</th>
                                <th className="px-4 py-4 font-medium text-black dark:text-white">Email</th>
                                <th className="px-4 py-4 font-medium text-black dark:text-white">Access Level</th>
                                <th className="px-4 py-4 font-medium text-black dark:text-white">Department</th>
                                <th className="px-4 py-4 font-medium text-black dark:text-white">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {subordinates.map((sub) => (
                                <tr key={sub._id || sub.id}>
                                    <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                                        <p className="font-medium text-black dark:text-white">{sub.fullname}</p>
                                    </td>
                                    <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                                        <p className="text-black dark:text-white">{sub.email}</p>
                                    </td>
                                    <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                                        <AccessLevelBadge level={sub.accessLevel} />
                                    </td>
                                    <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                                        <p className="text-black dark:text-white">
                                            {sub.department?.name || 'N/A'}
                                        </p>
                                    </td>
                                    <td className="border-b border-[#eee] px-4 py-5 dark:border-strokedark">
                                        <DirectorateAndAbove>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleOpenDelegateModal(sub)}
                                            >
                                                Delegate
                                            </Button>
                                        </DirectorateAndAbove>
                                    </td>
                                </tr>
                            ))}
                            {subordinates.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                                        No subordinates found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Delegation History */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
                    Delegation History
                </h3>

                <div className="mb-6">
                    <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Delegated By Me</h4>
                    {delegationHistory.delegatedBy.length > 0 ? (
                        <div className="space-y-2">
                            {delegationHistory.delegatedBy.map((del: any) => (
                                <div key={del._id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-medium text-black dark:text-white">
                                                {del.delegatee.fullname}
                                            </p>
                                            <p className="text-sm text-gray-500">{del.delegatee.email}</p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                Status: <span className={`font-medium ${del.status === 'active' ? 'text-green-600' : 'text-gray-600'
                                                    }`}>{del.status}</span>
                                            </p>
                                        </div>
                                        {del.status === 'active' && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleRevoke(del.delegatee._id || del.delegatee.id)}
                                            >
                                                Revoke
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-sm">No delegations made</p>
                    )}
                </div>
            </div>

            {/* Delegation Modal */}
            <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[600px] m-4">
                <div className="no-scrollbar relative w-full max-w-[600px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
                    <div className="px-2 pr-14 mb-6">
                        <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                            Delegate Authority
                        </h4>
                        {selectedUser && (
                            <p className="text-sm text-gray-500">
                                Delegating to: {selectedUser.fullname}
                            </p>
                        )}
                    </div>
                    <form onSubmit={handleDelegate}>
                        <div className="space-y-4 px-2">
                            <div>
                                <label className="flex items-center space-x-3">
                                    <input
                                        type="checkbox"
                                        checked={delegationForm.canManageTeams}
                                        onChange={(e) => setDelegationForm({ ...delegationForm, canManageTeams: e.target.checked })}
                                        className="h-4 w-4 rounded border-gray-300"
                                    />
                                    <span className="text-black dark:text-white">Can Manage Teams</span>
                                </label>
                            </div>
                            <div>
                                <label className="flex items-center space-x-3">
                                    <input
                                        type="checkbox"
                                        checked={delegationForm.canManageDepartments}
                                        onChange={(e) => setDelegationForm({ ...delegationForm, canManageDepartments: e.target.checked })}
                                        className="h-4 w-4 rounded border-gray-300"
                                    />
                                    <span className="text-black dark:text-white">Can Manage Departments</span>
                                </label>
                            </div>
                            <div>
                                <label className="flex items-center space-x-3">
                                    <input
                                        type="checkbox"
                                        checked={delegationForm.canApproveReports}
                                        onChange={(e) => setDelegationForm({ ...delegationForm, canApproveReports: e.target.checked })}
                                        className="h-4 w-4 rounded border-gray-300"
                                    />
                                    <span className="text-black dark:text-white">Can Approve Reports</span>
                                </label>
                            </div>
                            <div>
                                <Label>Reason (Optional)</Label>
                                <textarea
                                    value={delegationForm.reason}
                                    onChange={(e) => setDelegationForm({ ...delegationForm, reason: e.target.value })}
                                    className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
                                    rows={3}
                                />
                            </div>
                            <div>
                                <Label>Expiry Date (Optional)</Label>
                                <input
                                    type="date"
                                    value={delegationForm.endDate}
                                    onChange={(e) => setDelegationForm({ ...delegationForm, endDate: e.target.value })}
                                    className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
                            <Button size="sm" variant="outline" onClick={closeModal} type="button">
                                Cancel
                            </Button>
                            <Button size="sm" type="submit">
                                Delegate
                            </Button>
                        </div>
                    </form>
                </div>
            </Modal>
        </>
    );
}
