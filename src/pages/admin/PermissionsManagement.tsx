import { useState, useEffect } from 'react';
import { Shield, Users, UserPlus, Trash2, Edit, Save, X, Lock, Unlock, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

interface Role {
    id: string;
    name: string;
    permissions: string[];
    description: string;
    user_count?: number;
}

interface Permission {
    id: string;
    name: string;
    description: string;
    category: 'users' | 'content' | 'financial' | 'system' | 'reports';
}

const AVAILABLE_PERMISSIONS: Permission[] = [
    // Users
    { id: 'users.view', name: 'Ver Usuários', description: 'Visualizar lista de usuários', category: 'users' },
    { id: 'users.edit', name: 'Editar Usuários', description: 'Editar informações de usuários', category: 'users' },
    { id: 'users.delete', name: 'Deletar Usuários', description: 'Remover usuários permanentemente', category: 'users' },
    { id: 'users.ban', name: 'Banir Usuários', description: 'Banir/desbanir usuários', category: 'users' },
    { id: 'users.verify', name: 'Verificar Usuários', description: 'Aprovar/rejeitar verificação', category: 'users' },
    
    // Content
    { id: 'content.view', name: 'Ver Conteúdo', description: 'Visualizar anúncios e perfis', category: 'content' },
    { id: 'content.edit', name: 'Editar Conteúdo', description: 'Editar anúncios e perfis', category: 'content' },
    { id: 'content.delete', name: 'Deletar Conteúdo', description: 'Remover anúncios e perfis', category: 'content' },
    { id: 'content.moderate', name: 'Moderar Conteúdo', description: 'Moderar conteúdo de usuários', category: 'content' },
    { id: 'content.feature', name: 'Destacar Conteúdo', description: 'Adicionar aos destaques', category: 'content' },
    
    // Financial
    { id: 'financial.view', name: 'Ver Financeiro', description: 'Visualizar transações', category: 'financial' },
    { id: 'financial.edit', name: 'Editar Financeiro', description: 'Editar transações', category: 'financial' },
    { id: 'financial.refund', name: 'Reembolsar', description: 'Processar reembolsos', category: 'financial' },
    
    // System
    { id: 'system.settings', name: 'Configurações', description: 'Acessar configurações do sistema', category: 'system' },
    { id: 'system.backup', name: 'Backup', description: 'Criar e restaurar backups', category: 'system' },
    { id: 'system.logs', name: 'Ver Logs', description: 'Visualizar logs do sistema', category: 'system' },
    
    // Reports
    { id: 'reports.view', name: 'Ver Reports', description: 'Visualizar denúncias', category: 'reports' },
    { id: 'reports.resolve', name: 'Resolver Reports', description: 'Resolver denúncias', category: 'reports' },
];

export default function PermissionsManagement() {
    const [roles, setRoles] = useState<Role[]>([
        {
            id: 'super_admin',
            name: 'Super Admin',
            permissions: AVAILABLE_PERMISSIONS.map(p => p.id),
            description: 'Acesso total ao sistema',
            user_count: 1,
        },
        {
            id: 'admin',
            name: 'Administrador',
            permissions: ['users.view', 'users.edit', 'content.view', 'content.edit', 'content.moderate', 'reports.view', 'reports.resolve'],
            description: 'Acesso administrativo padrão',
            user_count: 0,
        },
        {
            id: 'moderator',
            name: 'Moderador',
            permissions: ['users.view', 'content.view', 'content.moderate', 'reports.view', 'reports.resolve'],
            description: 'Moderar conteúdo e reports',
            user_count: 0,
        },
        {
            id: 'support',
            name: 'Suporte',
            permissions: ['users.view', 'reports.view'],
            description: 'Visualizar usuários e reports',
            user_count: 0,
        },
    ]);
    
    const [editingRole, setEditingRole] = useState<string | null>(null);
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
    const [showCreateRole, setShowCreateRole] = useState(false);
    const [newRole, setNewRole] = useState({ name: '', description: '' });

    const permissionsByCategory = AVAILABLE_PERMISSIONS.reduce((acc, perm) => {
        if (!acc[perm.category]) acc[perm.category] = [];
        acc[perm.category].push(perm);
        return acc;
    }, {} as Record<string, Permission[]>);

    const handleEditRole = (role: Role) => {
        setEditingRole(role.id);
        setSelectedPermissions([...role.permissions]);
    };

    const handleSaveRole = (roleId: string) => {
        setRoles(roles.map(r => 
            r.id === roleId 
                ? { ...r, permissions: selectedPermissions }
                : r
        ));
        setEditingRole(null);
        // TODO: Save to database
    };

    const handleCreateRole = () => {
        if (newRole.name.trim()) {
            const role: Role = {
                id: newRole.name.toLowerCase().replace(/\s+/g, '_'),
                name: newRole.name,
                description: newRole.description,
                permissions: selectedPermissions,
                user_count: 0,
            };
            setRoles([...roles, role]);
            setNewRole({ name: '', description: '' });
            setSelectedPermissions([]);
            setShowCreateRole(false);
            // TODO: Save to database
        }
    };

    const togglePermission = (permissionId: string) => {
        if (selectedPermissions.includes(permissionId)) {
            setSelectedPermissions(selectedPermissions.filter(p => p !== permissionId));
        } else {
            setSelectedPermissions([...selectedPermissions, permissionId]);
        }
    };

    const getCategoryLabel = (category: string) => {
        const labels: Record<string, string> = {
            users: 'Usuários',
            content: 'Conteúdo',
            financial: 'Financeiro',
            system: 'Sistema',
            reports: 'Reports',
        };
        return labels[category] || category;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Gerenciamento de Permissões</h1>
                    <p className="text-muted-foreground mt-1">
                        Controle de acesso e permissões por role
                    </p>
                </div>
                <button
                    onClick={() => setShowCreateRole(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                    <UserPlus className="w-4 h-4" />
                    Nova Role
                </button>
            </div>

            {/* Create Role Form */}
            {showCreateRole && (
                <div className="bg-card border border-border rounded-lg p-6">
                    <h3 className="text-lg font-bold mb-4">Criar Nova Role</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Nome da Role</label>
                            <input
                                type="text"
                                value={newRole.name}
                                onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                                className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                placeholder="Ex: Editor"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Descrição</label>
                            <input
                                type="text"
                                value={newRole.description}
                                onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                                className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                placeholder="Descrição da role"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Permissões</label>
                            <div className="space-y-4">
                                {Object.entries(permissionsByCategory).map(([category, perms]) => (
                                    <div key={category} className="border border-border rounded-lg p-4">
                                        <h4 className="font-semibold mb-2">{getCategoryLabel(category)}</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            {perms.map(perm => (
                                                <label key={perm.id} className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedPermissions.includes(perm.id)}
                                                        onChange={() => togglePermission(perm.id)}
                                                        className="w-4 h-4"
                                                    />
                                                    <div>
                                                        <div className="text-sm font-medium">{perm.name}</div>
                                                        <div className="text-xs text-muted-foreground">{perm.description}</div>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => {
                                    setShowCreateRole(false);
                                    setNewRole({ name: '', description: '' });
                                    setSelectedPermissions([]);
                                }}
                                className="px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleCreateRole}
                                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                            >
                                Criar Role
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Roles List */}
            <div className="space-y-4">
                {roles.map((role) => (
                    <div key={role.id} className="bg-card border border-border rounded-lg p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <Shield className="w-5 h-5 text-primary" />
                                    <h3 className="text-xl font-bold">{role.name}</h3>
                                    {role.user_count !== undefined && (
                                        <span className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded">
                                            {role.user_count} usuário(s)
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-muted-foreground">{role.description}</p>
                            </div>
                            {editingRole === role.id ? (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleSaveRole(role.id)}
                                        className="p-2 text-green-600 hover:bg-green-500/10 rounded transition-colors"
                                    >
                                        <Save className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => {
                                            setEditingRole(null);
                                            setSelectedPermissions([]);
                                        }}
                                        className="p-2 text-muted-foreground hover:bg-muted rounded transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => handleEditRole(role)}
                                    className="p-2 text-primary hover:bg-primary/10 rounded transition-colors"
                                >
                                    <Edit className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {editingRole === role.id ? (
                            <div className="space-y-4">
                                {Object.entries(permissionsByCategory).map(([category, perms]) => (
                                    <div key={category} className="border border-border rounded-lg p-4">
                                        <h4 className="font-semibold mb-2">{getCategoryLabel(category)}</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            {perms.map(perm => (
                                                <label key={perm.id} className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedPermissions.includes(perm.id)}
                                                        onChange={() => togglePermission(perm.id)}
                                                        className="w-4 h-4"
                                                    />
                                                    <div>
                                                        <div className="text-sm font-medium">{perm.name}</div>
                                                        <div className="text-xs text-muted-foreground">{perm.description}</div>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <div className="text-sm font-medium mb-2">Permissões ({role.permissions.length})</div>
                                <div className="flex flex-wrap gap-2">
                                    {role.permissions.map(permId => {
                                        const perm = AVAILABLE_PERMISSIONS.find(p => p.id === permId);
                                        return perm ? (
                                            <span key={permId} className="px-2 py-1 bg-primary/20 text-primary text-xs rounded">
                                                {perm.name}
                                            </span>
                                        ) : null;
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}


