"use client";

import React from 'react';
import { useRouter } from 'next/navigation';

const QuotationPage = () => {
    const router = useRouter();

    React.useEffect(() => {
        router.push('/business/executive');
    }, [router]);

    return null;
};

export default QuotationPage;