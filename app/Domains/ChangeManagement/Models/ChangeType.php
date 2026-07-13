<?php

namespace App\Domains\ChangeManagement\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ChangeType extends Model
{
    use SoftDeletes;

    protected $fillable = ['name'];

    public function implementations()
    {
        return $this->belongsToMany(ChangeImplementation::class, 'change_implementation_type', 'change_type_id', 'change_implementation_id');
    }
}
