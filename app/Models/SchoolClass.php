<?php

namespace App\Models;

use App\Traits\HasTranslations;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SchoolClass extends Model
{
    use HasTranslations;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'classes';

    /**
     * Translatable attributes stored as JSON.
     *
     * @var list<string>
     */
    protected array $translatable = [
        'name',
    ];

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'code',
        'number_of_sections',
        'passing_score',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'name' => 'array',
            'number_of_sections' => 'integer',
            'passing_score' => 'decimal:2',
        ];
    }

    /**
     * Get the members enrolled in this class.
     */
    public function members(): HasMany
    {
        return $this->hasMany(Member::class, 'class_id');
    }

    /**
     * Get the courses taught for this class.
     */
    public function courses(): HasMany
    {
        return $this->hasMany(Course::class, 'class_id');
    }
}
