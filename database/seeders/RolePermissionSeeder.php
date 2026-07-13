<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        // Clear cached permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // === PERMISSIONS ===
        $permissions = [
            // User management
            'user.manage',
            'user.create',
            'user.update',
            'user.delete',
            'user.import',

            // Organization
            'field.manage',
            'team.manage',

            // WFH
            'wfh.attendance.create',
            'wfh.report.create',
            'wfh.report.update',
            'wfh.report.delete',
            'wfh.report.submit',
            'wfh.report.approve',
            'wfh.report.reject',
            'wfh.monitoring.view',
            'wfh.report.export_pdf',

            // Change Management
            'change.initiation.create',
            'change.initiation.update',
            'change.initiation.submit',
            'change.initiation.approve',
            'change.initiation.reject',
            'change.implementation.create',
            'change.implementation.update',
            'change.implementation.submit',
            'change.implementation.review',
            'change.implementation.export_pdf',
            'change.initiation.export_pdf',
        ];

        foreach ($permissions as $perm) {
            Permission::firstOrCreate(['name' => $perm, 'guard_name' => 'web']);
        }

        // === ROLES ===
        $admin = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
        $kepalaTim = Role::firstOrCreate(['name' => 'kepala_tim', 'guard_name' => 'web']);
        $staf = Role::firstOrCreate(['name' => 'staf', 'guard_name' => 'web']);

        // === ROLE → PERMISSION ASSIGNMENTS ===

        // Admin: everything
        $admin->givePermissionTo(Permission::all());

        // Kepala Tim (team leader): WFH approve/reject + monitoring, Change approve/review
        $kepalaTim->givePermissionTo([
            'wfh.attendance.create',
            'wfh.report.create',
            'wfh.report.update',
            'wfh.report.submit',
            'wfh.report.approve',
            'wfh.report.reject',
            'wfh.monitoring.view',
            'wfh.report.export_pdf',
            'change.initiation.create',
            'change.initiation.update',
            'change.initiation.submit',
            'change.initiation.approve',
            'change.initiation.reject',
            'change.implementation.create',
            'change.implementation.update',
            'change.implementation.submit',
            'change.implementation.review',
            'change.implementation.export_pdf',
            'change.initiation.export_pdf',
        ]);

        // Staf: create own records, submit, no approval power
        $staf->givePermissionTo([
            'wfh.attendance.create',
            'wfh.report.create',
            'wfh.report.update',
            'wfh.report.submit',
            'wfh.report.export_pdf',
            'change.initiation.create',
            'change.initiation.update',
            'change.initiation.submit',
            'change.implementation.create',
            'change.implementation.update',
            'change.implementation.submit',
        ]);
    }
}
