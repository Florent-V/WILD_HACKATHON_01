<?php

namespace App\Controller;

use App\Model\SportManager;

class AjaxController extends AbstractController
{
    public function __construct()
    {
        parent::__construct();
        header('Content-Type: application/json');
    }

    public function searchSport(string $search): string|null
    {
        if ($_SERVER['REQUEST_METHOD'] === 'GET') {
            $search = array_map('trim', $_GET);
            $search = array_map('htmlentities', $search);

            $sportManager = new SportManager();
            $sports = $sportManager->selectByKeyWord($search['search']);

            return json_encode($sports, JSON_PRETTY_PRINT | JSON_PRESERVE_ZERO_FRACTION);
        }
        return null;
    }
}
