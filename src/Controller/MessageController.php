<?php

namespace App\Controller;

use App\Model\MessageManager;

class MessageController extends AbstractController
{
    private MessageManager $messManager;

    public function __construct()
    {
        parent::__construct();
        $this->messManager = new MessageManager();
    }

    /**
     * Add a new message
     */
    public function insertMessage(): string
    {
        $errors = [];
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $messageContact = array_map('trim', $_POST);
            $errors = $this->validate($messageContact);
            if (empty($errors)) {
                $this->messManager->insert($messageContact);
                return $this->twig->render('Admin/success.html.twig', [
                    'messagesContact' => $messageContact,
                ]);
            }
        }

        return $this->twig->render('Home/contact.html.twig', [
            'errors' => $errors
        ]);
    }

    public function listMessage(): string
    {
        $messManager = new MessageManager();
        return $this->twig->render('Admin/admin_listmessage.html.twig', [
            'messagesContact' => $messManager->selectAll(),
        ]);
    }

    private function validate(array $messageContact): array
    {
        $errors = [];
        if (empty($messageContact['lastname'])) {
            $errors['lastname'] = 'Le champ nom est obligatoire.';
        }
        if (empty($messageContact['firstname'])) {
            $errors['firstname'] = 'Le champ prénom est obligatoire.';
        }
        if (empty($messageContact['email'])) {
            $errors['email'] = 'Le champ email est obligatoire.';
        }
        if (empty(filter_var($messageContact['email'], FILTER_VALIDATE_EMAIL))) {
            $errors['emailFormat'] = 'Le champ email est au mauvais format.';
        }
        if (empty($messageContact['message'])) {
            $errors['message'] = 'Le champ message est obligatoire.';
        }
        return $errors;
    }

    public function delete()
    {
        if ($_SERVER['REQUEST_METHOD'] === 'GET') {
            $id = trim($_GET['id']);
            $messManager = new MessageManager();
            $messManager->delete((int)$id);
            header('Location:/listmessage');
        }
    }
}
