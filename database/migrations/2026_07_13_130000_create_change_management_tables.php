<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('change_types', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('change_initiations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('field_id')->constrained('fields')->cascadeOnDelete();
            $table->foreignId('initiator_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('reviewer_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('doc_number')->unique();
            $table->date('initiation_date');
            $table->date('needed_by_date')->nullable();
            $table->text('description');
            $table->text('reason');
            $table->string('status', 20)->default('draft'); // draft, pending, approved, rejected
            $table->string('review_status', 10)->nullable(); // approved, rejected
            $table->timestamp('reviewed_at')->nullable();
            $table->text('review_reason')->nullable();
            $table->timestamp('initiator_signed_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['field_id', 'status']);
            $table->index('initiator_id');
        });

        Schema::create('change_implementations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('change_initiation_id')->constrained('change_initiations')->cascadeOnDelete();
            $table->string('priority', 10)->default('medium'); // low, medium, high, critical
            $table->string('impact', 10)->default('low'); // low, medium, high
            $table->text('production_impact')->nullable();
            $table->text('required_effort')->nullable();
            $table->boolean('cost_needed')->default(false);
            $table->decimal('cost_amount', 15, 2)->nullable();
            $table->text('resources')->nullable();
            $table->text('test_plan')->nullable();
            $table->foreignId('evaluator_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('evaluator_signed_at')->nullable();
            $table->string('review_status', 10)->nullable(); // diterima, ditolak, revisi
            $table->text('review_response')->nullable();
            $table->date('execution_date')->nullable();
            $table->foreignId('reviewer_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewer_signed_at')->nullable();
            $table->text('implementation_result')->nullable();
            $table->text('testing_result')->nullable();
            $table->date('release_date')->nullable();
            $table->foreignId('responsible_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('responsible_signed_at')->nullable();
            $table->string('status', 20)->default('draft'); // draft, submitted, completed, revision
            $table->timestamps();
            $table->softDeletes();

            $table->index('change_initiation_id');
        });

        Schema::create('change_implementation_type', function (Blueprint $table) {
            $table->foreignId('change_implementation_id')->constrained('change_implementations')->cascadeOnDelete();
            $table->foreignId('change_type_id')->constrained('change_types')->cascadeOnDelete();
            $table->primary(['change_implementation_id', 'change_type_id']);
        });

        Schema::create('change_implementation_attachments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('change_implementation_id')->constrained('change_implementations')->cascadeOnDelete();
            $table->string('path');
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->index('change_implementation_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('change_implementation_attachments');
        Schema::dropIfExists('change_implementation_type');
        Schema::dropIfExists('change_implementations');
        Schema::dropIfExists('change_initiations');
        Schema::dropIfExists('change_types');
    }
};
