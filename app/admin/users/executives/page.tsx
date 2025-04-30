"use client"
import React from 'react';
import { useRouter } from 'next/navigation';
import { WithAdminAuth } from '@/components/withAdminAuth';
import {
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Card,
    CardHeader,
    CardBody,
    Button,
    Spinner,
    Chip,
    Input,
    useDisclosure,
    Select,
    SelectItem,
} from "@heroui/react";
import { Search, ChevronDown, ChevronUp, Filter } from "lucide-react";
import { toast } from 'react-toastify';
import api, { Executive, ExecutiveWithRoleName, Role } from '@/services/api';
import { currentUserHasPermission, PERMISSIONS } from '@/utils/permissions';

const ExecutivesPage: React.FC = () => {
    const router = useRouter();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const { isOpen: isDeleteModalOpen, onOpen: onDeleteModalOpen, onClose: onDeleteModalClose } = useDisclosure();
    const [executives, setExecutives] = React.useState<ExecutiveWithRoleName[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [selectedExecutive, setSelectedExecutive] = React.useState<ExecutiveWithRoleName | null>(null);
    const [isSuperAdmin, setIsSuperAdmin] = React.useState(false);
    const [canViewExecDetails, setCanViewExecDetails] = React.useState(true);
    const [canAddExecutive, setCanAddExecutive] = React.useState(true);
    const [searchQuery, setSearchQuery] = React.useState('');
    const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc');
    const [roleFilter, setRoleFilter] = React.useState<string>("");
    const [uniqueRoles, setUniqueRoles] = React.useState<{ id: string, name: string, entity_type: string }[]>([]);

    const formatDate = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            return dateString;
        }
    };

    React.useEffect(() => {
        const fetchExecutives = async () => {
            try {
                const token = api.getStoredToken();
                if (!token) {
                    toast.error('Please login again');
                    router.push('/admin/login');
                    return;
                }

                const response = await api.getAllEntities();
                setExecutives(response.data);

                const roles = new Map<string, { id: string, name: string, entity_type: string }>();
                response.data.forEach((exec) => {
                    const roleId = exec.role_details.id.toString();
                    if (!roles.has(roleId)) {
                        roles.set(roleId, {
                            id: roleId,
                            name: exec.role_details.name,
                            entity_type: exec.role_details.entity_type
                        });
                    }
                });

                setUniqueRoles(Array.from(roles.values()));
            } catch (error: any) {
                const errorMsg = error?.response?.data?.message || 'Failed to fetch executives';
                toast.error(errorMsg);
                if (error?.response?.status === 401) {
                    router.push('/admin/login');
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchExecutives();
    }, [router]);

    React.useEffect(() => {
        const userData = api.getStoredUser();
        const isSuperAdminUser = userData?.role?.entity_type === 'SupAdmin';
        setIsSuperAdmin(isSuperAdminUser);

        if (!isSuperAdminUser) {
            setCanViewExecDetails(currentUserHasPermission(PERMISSIONS.VIEW_EXECUTIVE_DETAILS));
            setCanAddExecutive(currentUserHasPermission(PERMISSIONS.SHOW_ADD_EXECUTIVE_BUTTON));
        }
    }, []);

    const handleRowClick = (executive: ExecutiveWithRoleName) => {
        if (!isSuperAdmin && !canViewExecDetails) {
            return;
        }

        router.push(`/admin/users/executives/${executive.id}`);
    };

    const handleAddExecutive = () => {
        router.push('/admin/users/executives/create_exec');
    };

    const toggleSortDirection = () => {
        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    };

    const handleRoleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setRoleFilter(e.target.value);
    };

    const resetFilters = () => {
        setSearchQuery('');
        setRoleFilter('');
    };

    const filteredExecutives = React.useMemo(() => {
        let result = [...executives];

        if (searchQuery.trim()) {
            result = result.filter(exec =>
                exec.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                exec.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                exec.role_details.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                exec.role_details.entity_type.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        if (roleFilter) {
            result = result.filter(exec => exec.role_details.id.toString() === roleFilter);
        }

        result.sort((a, b) => {
            const nameA = a.username.toLowerCase();
            const nameB = b.username.toLowerCase();

            if (sortDirection === 'asc') {
                return nameA.localeCompare(nameB);
            } else {
                return nameB.localeCompare(nameA);
            }
        });

        return result;
    }, [executives, searchQuery, roleFilter, sortDirection]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    };

    const hasActiveFilters = searchQuery || roleFilter;

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-[50vh]">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="w-full p-6">
            <Card>
                <CardHeader className="flex justify-between items-center px-6 py-4">
                    <h1 className="text-2xl font-bold">Executives Management</h1>
                    {(isSuperAdmin || canAddExecutive) && (
                        <Button
                            color="primary"
                            onPress={handleAddExecutive}
                        >
                            Add Executive
                        </Button>
                    )}
                </CardHeader>
                <CardBody>
                    <div className="mb-4 flex flex-col md:flex-row gap-4 items-start md:items-center">
                        <Input
                            type="text"
                            placeholder="Search by username, email, or role..."
                            value={searchQuery}
                            onChange={handleSearchChange}
                            startContent={<Search className="text-default-300" size={18} />}
                            onClear={() => setSearchQuery('')}
                            className="w-full md:w-1/3"
                            classNames={{
                                inputWrapper: "h-[40px]"  // Set consistent height
                            }}
                        />
                        
                        <Select
                            label=""  // Remove label to make height consistent
                            placeholder="Filter by role"
                            selectedKeys={roleFilter ? [roleFilter] : []}
                            onChange={handleRoleFilterChange}
                            className="w-full md:w-1/4"
                            startContent={<Filter className="text-default-300" size={16} />}
                            classNames={{
                                trigger: "h-[40px]",  // Set consistent height
                                value: "text-small"   // Adjust text size if needed
                            }}
                        >
                            <SelectItem key="" value="">All Roles</SelectItem>
                            {uniqueRoles.map((role) => (
                                <SelectItem key={role.id} value={role.id}>
                                    {role.name} ({role.entity_type})
                                </SelectItem>
                            )) as any}
                        </Select>
                        
                        {hasActiveFilters && (
                            <Button 
                                color="danger" 
                                variant="flat" 
                                onClick={resetFilters}
                                size="sm"
                                className="h-[40px]"  // Make button height consistent too
                            >
                                Clear Filters
                            </Button>
                        )}
                    </div>
                    
                    {searchQuery.trim() && (
                        <div className="mb-2 text-sm text-default-500">
                            Found {filteredExecutives.length} {filteredExecutives.length === 1 ? 'result' : 'results'}
                        </div>
                    )}

                    <Table
                        aria-label="Executives table"
                        selectionMode="none"
                        classNames={{
                            wrapper: "min-h-[400px]",
                            tr: isSuperAdmin || canViewExecDetails
                                ? "cursor-pointer hover:bg-default-100"
                                : "cursor-default",
                        }}
                    >
                        <TableHeader>
                            <TableColumn>
                                <button
                                    className="flex items-center bg-transparent border-none p-0 text-inherit cursor-pointer"
                                    onClick={toggleSortDirection}
                                    aria-label={`Sort by username ${sortDirection === 'asc' ? 'descending' : 'ascending'}`}
                                >
                                    USERNAME
                                    {sortDirection === 'asc' ?
                                        <ChevronDown className="ml-1 h-4 w-4" /> :
                                        <ChevronUp className="ml-1 h-4 w-4" />
                                    }
                                </button>
                            </TableColumn>
                            <TableColumn>EMAIL</TableColumn>
                            <TableColumn>ROLE</TableColumn>
                            <TableColumn>JOINED</TableColumn>
                        </TableHeader>
                        <TableBody
                            emptyContent="No executives found"
                            items={filteredExecutives}
                        >
                            {(executive) => (
                                <TableRow
                                    key={executive.id}
                                    onClick={() => handleRowClick(executive)}
                                >
                                    <TableCell>{executive.username}</TableCell>
                                    <TableCell>{executive.email}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <Chip
                                                variant="flat"
                                                color={
                                                    executive.role_details?.entity_type === 'SupAdmin' ? 'danger' :
                                                    executive.role_details?.entity_type === 'Admin' ? 'primary' :
                                                    executive.role_details?.entity_type === 'Editor' ? 'warning' :
                                                    executive.role_details?.entity_type === 'Executive' ? 'success' :
                                                    executive.role_details?.entity_type === 'Author' ? 'secondary' :
                                                    'default'
                                                }
                                                size="sm"
                                            >
                                                {executive.role_details?.name} ({executive.role_details?.entity_type})
                                            </Chip>
                                        </div>
                                    </TableCell>
                                    <TableCell>{formatDate(executive.created_at)}</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardBody>
            </Card>
        </div>
    );
};

export default WithAdminAuth(ExecutivesPage, PERMISSIONS.SHOW_EXECUTIVES_TAB);