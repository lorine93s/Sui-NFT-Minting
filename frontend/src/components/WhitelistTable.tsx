import {
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableRow,
} from "./ui/table";
// import Badge from "./ui/badge/Badge";
import Button from "./Button";

export interface WhitelistUser {
    name: string;
    address: string;
    // Optional fields
    image?: string;
    role?: string;
}

interface WhitelistTableProps {
    data: WhitelistUser[];
    onRemove: (address: string) => void;
}

export default function WhitelistTable({ data, adminFlag, onRemove }: WhitelistTableProps) {
    const handleRemove = (address: string) => {
        onRemove(address);
    };

    return (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
            <div className="max-w-full overflow-x-auto">
                <Table>
                    {/* Table Header */}
                    <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                        <TableRow>
                            <TableCell
                                isHeader
                                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                            >
                                User
                            </TableCell>
                            <TableCell
                                isHeader
                                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                            >
                                Address
                            </TableCell>
                            <TableCell
                                isHeader
                                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                            >
                                Action
                            </TableCell>
                        </TableRow>
                    </TableHeader>

                    {/* Table Body */}
                    <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                        {data.map((user) => (
                            <TableRow key={user.address}>
                                <TableCell className="px-5 py-4 sm:px-6 text-start">
                                    <div className="flex items-center gap-3">
                                        <div>
                                            <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                                                {user.name}
                                            </span>
                                            {user.role && (
                                                <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                                                    {user.role}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                                    {user.address}
                                </TableCell>
                                <TableCell className="px-4 py-3 text-start">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-red-600 border-red-600 hover:bg-red-100"
                                        onClick={() => handleRemove(user.address)}
                                        disabled={!adminFlag} // Disable button if adminFlag is true
                                    >
                                        Remove
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}