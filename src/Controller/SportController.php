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
        $response = $client->request('GET', 'http://api.ipapi.com/' . $ipAdress . '?access_key=2d997fde9198b489e9719e0e83dc6430');

        $statusCode = $response->getStatusCode();
        $type = $response->getHeaders()['content-type'][0];

        $content = '';

        if ($statusCode === 200 && $type === 'application/json') {
            $content = $response->getContent();
            // get the response in JSON format

            $content = $response->toArray();
            // convert the response (here in JSON) to an PHP array
        }

        $coordinate = [];

        $coordinate['latitude'] = $content['latitude'];
        $coordinate['longitude'] = $content['longitude'];
        $coordinate['city'] = explode(' ', $content['city'])[0];
        $coordinate['region'] = $content['region_name'];
        $coordinate['country'] = $content['country_name'];
        $coordinate['code'] = $content['country_code'];

        return $coordinate;
    }

    public function searchAroundMe(int $page = 1)
    {
        //$coordinate = $this->getCoordinateFromIp('185.234.71.162'); //récupérer celle de l'utilisateur MARSEILLE
        //$coordinate = $this->getCoordinateFromIp('185.193.64.70'); //récupérer celle de l'utilisateur QUEBEC
        //$coordinate = $this->getCoordinateFromIp('185.216.74.142'); //récupérer celle de l'utilisateur LOS ANGELES
        $coordinate = $this->getCoordinateFromIp('82.232.237.157'); //récupérer celle de l'utilisateur LOOS


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
