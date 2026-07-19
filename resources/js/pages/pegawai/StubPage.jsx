import React from 'react';

export default function StubPage({ title }) {
    return (
        <div className="max-w-[1200px] mx-auto">
            <h1 className="text-3xl font-extrabold text-gray-900">{title}</h1>
            <div className="mt-8 bg-white rounded-2xl border border-gray-200 p-12 text-center">
                <p className="text-gray-500">Halaman ini sedang dalam pengembangan.</p>
                <p className="text-sm text-gray-400 mt-2">
                    Desain dan integrasi backend untuk modul ini akan ditambahkan berikutnya.
                </p>
            </div>
        </div>
    );
}
