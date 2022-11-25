<?php

namespace App\Controller;

use App\Model\SportManager;
use Symfony\Component\HttpClient\HttpClient;

class SportController extends AbstractController
{
    public function search()
    {
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $searchInfos = array_map('trim', $_POST);
            $searchInfos = array_map('htmlentities', $searchInfos);

            $page = 1;

            // Récupération d'un objet HttpClient :
            $client = HttpClient::create();

            $url = 'https://sportplaces.api.decathlon.com/api/v1/places?origin=' .
                $searchInfos['longitude'] . ',' .
                $searchInfos['latitude'] . '&radius=50&sports=' . $searchInfos['sportID'] . '&page=' . $page;

            $response = $client->request('GET', $url);

            $statusCode = $response->getStatusCode();
            $type = $response->getHeaders()['content-type'][0];

            $content = '';

            if ($statusCode === 200 && $type === 'application/json; charset=utf-8') {
                $content = $response->getContent();
                // get the response in JSON format

                $content = $response->toArray();
                // convert the response (here in JSON) to an PHP array
            }

            $data = $content['data']['features'];
            $places = [];

            foreach ($data as $item) {
                $new = [];
                if (substr($item['properties']['name'], -1) != '-') {
                    $new['name'] = $item['properties']['name'];
                    $new['uuid'] = $item['properties']['uuid'];
                    $new['distance'] = round($item['properties']['proximity'], 2);
                    $new['google_place_id'] = $item['properties']['google_place_id'];
                    $new['adress'] = $item['properties']['address_components'];
                    $new['activities'] = $this->getSportNameById($item['properties']['activities'][0]['sport_id']);
                    if ($item['geometry']['type'] === 'Point') {
                        $new['coordinates'] = $item['geometry']['coordinates'];
                    } else {
                        $new['coordinates'] = $item['geometry']['coordinates'][0];
                    }
                    $places[] = $new;
                }
            }

            return $this->twig->render('Places/search.html.twig', [
                'places' => $places,
                'coordinate' => $searchInfos,
            ]);
        }

        return $this->twig->render('Places/search.html.twig');
    }

    private function getCoordinateFromIp(string $ipAdress)
    {
        // Récupération d'un objet HttpClient :
        $client = HttpClient::create();

        //Récupération coordonnées de l'utilisateur ici IP en dur pour utilisation localhost
        $response = $client->request('GET', 'http://www.geoplugin.net/json.gp?ip=' . $ipAdress);

        $statusCode = $response->getStatusCode();
        $type = $response->getHeaders()['content-type'][0];

        $content = '';

        if ($statusCode === 200 && $type === 'application/json; charset=utf-8') {
            $content = $response->getContent();
            // get the response in JSON format

            $content = $response->toArray();
            // convert the response (here in JSON) to an PHP array
        }

        $coordinate = [];

        $coordinate['latitude'] = $content['geoplugin_latitude'];
        $coordinate['longitude'] = $content['geoplugin_longitude'];
        $coordinate['city'] = $content['geoplugin_city'];

        return $coordinate;
    }

    public function searchAroundMe(int $page = 1)
    {
        $coordinate = $this->getCoordinateFromIp('92.184.121.159'); //récupérer celle de l'utilisateur


        // Récupération d'un objet HttpClient :
        $client = HttpClient::create();

        $url = 'https://sportplaces.api.decathlon.com/api/v1/places?origin=' .
            $coordinate['longitude'] . ',' .
            $coordinate['latitude'] . '&radius=20' . '&page=' . $page;

        $response = $client->request('GET', $url);

        $statusCode = $response->getStatusCode();
        $type = $response->getHeaders()['content-type'][0];

        $content = '';

        if ($statusCode === 200 && $type === 'application/json; charset=utf-8') {
            $content = $response->getContent();
            // get the response in JSON format

            $content = $response->toArray();
            // convert the response (here in JSON) to an PHP array
        }

        $data = $content['data']['features'];
        $places = [];

        foreach ($data as $item) {
            $new = [];
            if (substr($item['properties']['name'], -1) != '-') {
                $new['name'] = $item['properties']['name'];
                $new['uuid'] = $item['properties']['uuid'];
                $new['distance'] = round($item['properties']['proximity'], 2);
                $new['google_place_id'] = $item['properties']['google_place_id'];
                $new['adress'] = $item['properties']['address_components'];
                $new['activities'] = $this->getSportNameById($item['properties']['activities'][0]['sport_id']);
                if ($item['geometry']['type'] === 'Point') {
                    $new['coordinates'] = $item['geometry']['coordinates'];
                } else {
                    $new['coordinates'] = $item['geometry']['coordinates'][0];
                }
                $places[] = $new;
            }
        }

        return $this->twig->render('Places/aroundme.html.twig', [
            'places' => $places,
            'coordinate' => $coordinate,
        ]);
    }




    private function getSportNameById(int $sportId)
    {
        $client = HttpClient::create();

        $url = 'https://sportplaces.api.decathlon.com/api/v1/sports/' . $sportId;

        $response = $client->request('GET', $url);

        $statusCode = $response->getStatusCode();
        $type = $response->getHeaders()['content-type'][0];

        $content = '';

        if ($statusCode === 200 && $type === 'application/json; charset=utf-8') {
            $content = $response->getContent();

            $content = $response->toArray();

            return $content['name'];
        }
    }

    public function addSports()
    {
        //Ajouter la route 'addsports' => ['SportController', 'addSports',],
        // Pour importer la liste des sports en BDD
        $client = HttpClient::create();

        for ($i = 1; $i < 1200; $i++) {
            $url = 'https://sportplaces.api.decathlon.com/api/v1/sports/' . $i;

            $response = $client->request('GET', $url);

            $statusCode = $response->getStatusCode();
            //$type = $response->getHeaders()['content-type'][0];

            $content = '';

            if ($statusCode === 200) {
                $content = $response->getContent();

                $content = $response->toArray();

                $sportManager = new SportManager();
                $sportManager->insert($i, $content['name']);
            }
        }
    }
}
