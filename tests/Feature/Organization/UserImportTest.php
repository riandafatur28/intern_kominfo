<?php

namespace Tests\Feature\Organization;

use App\Models\User;
use App\Support\Import\UserImport;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Maatwebsite\Excel\Facades\Excel;
use Tests\TestCase;

class UserImportTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->artisan('db:seed', ['--class' => 'RolePermissionSeeder']);
        $this->artisan('db:seed', ['--class' => 'SettingsSeeder']);
    }

    public function test_import_with_role_column_creates_users_with_role(): void
    {
        $csv = "nama,nip,email,role\n"
            . "User Satu,0000000201,satu@test.com,staf\n"
            . "User Dua,0000000202,dua@test.com,kepala_tim\n";

        file_put_contents('/tmp/test_import.csv', $csv);

        $import = new UserImport;
        Excel::import($import, '/tmp/test_import.csv');

        $this->assertEquals(2, $import->results['imported']);

        $user1 = User::where('email', 'satu@test.com')->first();
        $this->assertNotNull($user1);
        $this->assertEquals('staf', $import->roleAssignments['satu@test.com']);
        $this->assertTrue($user1->must_change_password);

        $user2 = User::where('email', 'dua@test.com')->first();
        $this->assertNotNull($user2);
        $this->assertEquals('kepala_tim', $import->roleAssignments['dua@test.com']);
    }

    public function test_import_with_invalid_role_triggers_validation_error(): void
    {
        $csv = "nama,nip,email,role\n"
            . "User Bad,0000000203,bad@test.com,superhero\n";

        file_put_contents('/tmp/test_import_invalid.csv', $csv);

        $import = new UserImport;

        try {
            Excel::import($import, '/tmp/test_import_invalid.csv');
            $this->fail('Expected validation exception was not thrown.');
        } catch (\Maatwebsite\Excel\Validators\ValidationException $e) {
            $this->assertNotEmpty($e->errors());
        }
    }
}
