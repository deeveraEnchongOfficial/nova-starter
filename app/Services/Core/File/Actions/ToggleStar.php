<?php

namespace App\Services\Core\File\Actions;

use App\Services\Core\File\File;
use App\Services\Core\File\Folder;
use Illuminate\Database\Eloquent\Model;

class ToggleStar
{
    /**
     * Toggle the star status of a file or folder.
     *
     * @param  File|Folder  $resource  The resource to star/unstar
     */
    public function execute(File|Folder $resource): File|Folder
    {
        $current = (bool) $resource->getMetadata('is_starred', false);

        $resource->setMetadata('is_starred', ! $current);
        $resource->save();

        return $resource;
    }
}
