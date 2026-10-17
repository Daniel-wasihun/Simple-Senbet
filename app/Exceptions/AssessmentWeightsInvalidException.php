<?php

namespace App\Exceptions;

use Exception;

class AssessmentWeightsInvalidException extends Exception
{
    public function __construct(float $actualTotal, int $assignmentId)
    {
        parent::__construct(
            sprintf(
                'Assessment weights for teaching assignment %d must total exactly 100.00%%, got %.2f%%.',
                $assignmentId,
                $actualTotal
            ),
            422
        );
    }
}
