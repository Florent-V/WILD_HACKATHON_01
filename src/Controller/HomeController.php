<?php

namespace App\Controller;

class HomeController extends AbstractController
{
    /**
     * Display home page
     */
    public function index(): string
    {
        return $this->twig->render('Home/index.html.twig');
    }

    public function about(): string
    {
        return $this->twig->render('Home/about.html.twig');
    }

    public function err404(): string
    {
        return $this->twig->render('Home/404.html.twig');
    }
}
