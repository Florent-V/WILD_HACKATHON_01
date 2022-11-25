<?php

namespace App\Model;

use PDO;

class MessageManager extends AbstractManager
{
    public const TABLE = 'message';

    /**
     * Insert new item in database
     */
    public function insert(array $messageContact)
    {
        $query = 'INSERT INTO ' . self::TABLE . ' (lastname, firstname, email, message) VALUES
        (:lastname, :firstname, :email, :message)';
        $statement = $this->pdo->prepare($query);
        $statement->bindValue(':lastname', $messageContact['lastname'], PDO::PARAM_STR);
        $statement->bindValue(':firstname', $messageContact['firstname'], PDO::PARAM_STR);
        $statement->bindValue(':email', $messageContact['email'], PDO::PARAM_STR);
        $statement->bindValue(':message', $messageContact['message'], PDO::PARAM_STR);
        $statement->execute();
        return $this->pdo->lastInsertId();
    }
}
