<?php

namespace App\Model;

use PDO;

class SportManager extends AbstractManager
{
    public const TABLE = 'sport';

    /**
     * Insert new item in database
     */
    public function insert(int $id, string $sport): int
    {
        $statement = $this->pdo->prepare("INSERT INTO " . self::TABLE . " (`id`, `name`) VALUES (:id, :name)");
        $statement->bindValue(':id', $id, PDO::PARAM_INT);
        $statement->bindValue(':name', $sport, PDO::PARAM_STR);

        $statement->execute();
        return (int)$this->pdo->lastInsertId();
    }

    public function selectByKeyWord(string $keyWord)
    {
        $statement = $this->pdo->prepare("SELECT * FROM " . self::TABLE . " WHERE name LIKE :keyword");
        $statement->bindValue(':keyword', '%' . $keyWord . '%', PDO::PARAM_STR);
        $statement->execute();

        return $statement->fetchAll();
    }

    /**
     * Update item in database
     */
    public function update(array $item): bool
    {
        $statement = $this->pdo->prepare("UPDATE " . self::TABLE . " SET `title` = :title WHERE id=:id");
        $statement->bindValue('id', $item['id'], PDO::PARAM_INT);
        $statement->bindValue('title', $item['title'], PDO::PARAM_STR);

        return $statement->execute();
    }
}
