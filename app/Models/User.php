<?php

namespace App\Models;
 
use App\Models\Role;  
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany; 
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;   

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    
    protected $fillable = [
        'name', 
        'email',
        'password',
        'phone_number',
        'profile_picture',
        'language',
    ];

    
    protected $hidden = [
        'password',
        'remember_token',
    ];
 
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'status' => 'boolean',
        'is_locked' => 'boolean',
        'login_attempts' => 'integer',
        'locked_until' => 'datetime',
        'last_login' => 'datetime', 
    ];

    
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(
            Role::class,
            'role_user',
            'user_id',
            'role_id'
        )->withTimestamps();
    }

   

  
    
    public function hasRole(string $roleSlug): bool
    {
        return $this->roles()
            ->where('slug', $roleSlug)
            ->exists();
    }

   
    public function hasPermission(string $permissionSlug): bool
    {
        return $this->roles()
            ->whereHas('permissions', function ($query) use ($permissionSlug) {
                $query->where(
                    'permissions.slug',
                    $permissionSlug
                );
            })
            ->exists();
    }
 /**
     * Get the teaching assignments associated with this teacher/user.
     */
    public function teachingAssignments(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(TeachingAssignment::class, 'teacher_id');
    }
    
   
   

    
}





 

 

    
 

   
   







