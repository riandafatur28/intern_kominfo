<?php

namespace App\Http\Controllers;

use BaconQrCode\Renderer\Image\SvgImageBackEnd;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Response;

class SpikeController extends Controller
{
    /**
     * M1 Spike: WFH PDF — test signature image precision positioning.
     */
    public function wfh(): Response
    {
        $qrSvg = $this->generateQrSvg('https://internal-kominfo.test/verify/'.hash('sha256', 'WFH-2026-001-test'));

        $data = [
            'nama' => 'Aditya Rama Danial, S.Kom',
            'nip' => '3578151712990006',
            'pangkat' => '-',
            'jabatan' => 'Tenaga Ahli Fullstack Programmer Maintainer',
            'unitKerja' => 'Bidang Aplikasi Informatika',
            'tanggalPelaksanaan' => '03 Juli 2026',
            'kegiatan' => [
                ['waktu' => '07.30 – 08.30', 'kegiatan' => 'Rapat Bidang dan Rapat Tim Aplikasi', 'links' => []],
                ['waktu' => '09.00 – 11.30', 'kegiatan' => 'Rapat Koordinasi Pemenuhan Dokumen, Pembangunan dan Pengembangan Aplikasi', 'links' => [
                    'https://drive.google.com/file/d/12G_3EPslIQv821FyRgdFYwd5LIV2dBdG/view',
                ]],
                ['waktu' => '12.30 – 15.00', 'kegiatan' => 'Revisi Excel BCP Majadigi V1', 'links' => [
                    'https://drive.google.com/file/d/1xFMTBBnceIBP7RZtVb6ZTzcmkThnFUQi/view',
                    'https://drive.google.com/file/d/1pPTUJUnvxAVN2WhijLGwgzNSsi3eR8ky/view',
                ]],
                ['waktu' => '15.00 – 16.30', 'kegiatan' => 'Integrasi Menu Dashboard BPJS TK dan Menu BMKG di jatimprov v2', 'links' => [
                    'https://drive.google.com/file/d/1dm22hs9_yvOyALjOy0aB3pp2T-3BpOFZ/view',
                ]],
            ],
            'signatureMakerPath' => public_path('storage/signatures/test-signature.svg'),
            'signatureSupervisorPath' => public_path('storage/signatures/test-signature-2.svg'),
            'makerName' => 'ADITYA RAMA DANIAL, S.Kom',
            'makerNip' => '3578151712990006',
            'supervisorName' => 'GUGI ALIFRIANTO WICAKSONO, S.T., M.M',
            'supervisorNip' => '19821016 201101 1 005',
            'qrSvg' => $qrSvg,
        ];

        $pdf = Pdf::loadView('spike.wfh-report', $data);
        $pdf->setPaper('A4', 'portrait');

        return $pdf->download('spike-wfh.pdf');
    }

    /**
     * M2 Spike: Change Implementation PDF — test checkbox unicode rendering.
     */
    public function changeImpl(): Response
    {
        $qrSvg = $this->generateQrSvg('https://internal-kominfo.test/verify/'.hash('sha256', 'CHG-2026-001-test'));

        // Selected types for testing checkbox rendering
        $selectedTypes = ['Aplikasi', 'Prosedur'];
        $priority = 'Minor'; // Normal|Emergency
        $impact = 'Minor';   // Minor|Mayor
        $reviewStatus = 'DITERIMA'; // DITERIMA|DITOLAK

        $data = [
            'docNumber' => '706 / 9 / 1.1 / 114 / 2026',
            'tanggal' => '08 Maret 2026',
            'bidang' => 'Aplikasi Informatika',
            'allTypes' => ['Hardware', 'Network', 'Software', 'Utilities', 'Aplikasi', 'Prosedur', 'Operating System', 'Personil'],
            'selectedTypes' => $selectedTypes,
            'allPriorities' => ['Normal', 'Emergency'],
            'priority' => $priority,
            'allImpacts' => ['Minor', 'Mayor'],
            'impact' => $impact,
            'productionImpact' => 'Integrasi atau penambahan modul Mudik Gratis pada platform/website Majadigi.',
            'requiredEffort' => 'Membuat desain tampilan, sudah disediakan, diintegrasikan, melakukan test terhadap tampilan yang mengintegerasikan API yang terhadap server production',
            'costNeeded' => false,
            'costAmount' => 0,
            'resources' => 'Personil 2 org: FE Developer dan BE Developer',
            'testPlan' => '-',
            'evaluatorName' => 'Aditya Rama Danial',
            'evaluatorBidang' => 'Aptika',
            'evaluatorJabatan' => 'Tenaga Ahli',
            'evaluatorSigPath' => public_path('storage/signatures/test-signature.svg'),
            'reviewStatus' => $reviewStatus,
            'reviewResponse' => '',
            'executionDate' => '08 Maret 2026',
            'reviewerName' => 'I Wayan Rudy Artha',
            'reviewerBidang' => 'Aptika',
            'reviewerJabatan' => 'Prakom Ahli Muda',
            'reviewerSigPath' => public_path('storage/signatures/test-signature-2.svg'),
            'implementationResult' => '',
            'testingResult' => '',
            'releaseDate' => '19 Maret 2026',
            'responsibleName' => 'I Wayan Rudy Artha',
            'responsibleBidang' => 'Aptika',
            'responsibleJabatan' => 'Prakom Ahli Muda',
            'responsibleSigPath' => public_path('storage/signatures/test-signature-2.svg'),
            'qrSvg' => $qrSvg,
        ];

        $pdf = Pdf::loadView('spike.change-impl', $data);
        $pdf->setPaper('A4', 'portrait');

        return $pdf->download('spike-change-impl.pdf');
    }

    private function generateQrSvg(string $data): string
    {
        $renderer = new ImageRenderer(
            new RendererStyle(120, margin: 0),
            new SvgImageBackEnd,
        );
        $writer = new Writer($renderer);

        return $writer->writeString($data);
    }
}
