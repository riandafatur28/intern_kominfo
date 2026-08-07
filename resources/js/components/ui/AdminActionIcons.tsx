type IconProps = { size?: number; className?: string };

function Icon({ children, size = 18, className }: IconProps & { children: React.ReactNode }) {
    return <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>{children}</svg>;
}

export function AddIcon(props: IconProps) {
    return <Icon {...props}><path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></Icon>;
}

export function UploadIcon(props: IconProps) {
    return <Icon {...props}><path d="M10 13V3m0 0L6.5 6.5M10 3l3.5 3.5M4 12.5V16h12v-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></Icon>;
}

export function FilterIcon(props: IconProps) {
    return <Icon {...props}><path d="M3 4h14l-5.4 6.1v4.2l-3.2 1.7v-5.9L3 4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></Icon>;
}

export function ChevronDownIcon(props: IconProps) {
    return <Icon {...props}><path d="M5 7.5l5 5 5-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></Icon>;
}

export function SaveIcon(props: IconProps) {
    return <Icon {...props}><path d="M4 3h10l2 2v12H4V3zm3 0v5h6V3m-6 10h6" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></Icon>;
}

export function CloseIcon(props: IconProps) {
    return <Icon {...props}><path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></Icon>;
}

export function TrashIcon(props: IconProps) {
    return <Icon {...props}><path d="M4 6h12M8 6V4.5h4V6m2 0v10H6V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></Icon>;
}

export function EyeIcon(props: IconProps) {
    return <Icon {...props}><path d="M2.5 10s2.7-4.5 7.5-4.5 7.5 4.5 7.5 4.5-2.7 4.5-7.5 4.5S2.5 10 2.5 10zM10 12a2 2 0 100-4 2 2 0 000 4z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></Icon>;
}

export function SparklesIcon(props: IconProps) {
    return <Icon {...props}><path d="M10 2l1.1 4.1L15 7.2l-3.9 1.1L10 12.5 8.9 8.3 5 7.2l3.9-1.1L10 2zm5.2 10.1l.5 1.8 1.8.5-1.8.5-.5 1.8-.5-1.8-1.8-.5 1.8-.5.5-1.8z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" /></Icon>;
}


export function EditIcon(props: IconProps) {
    return <Icon {...props}><path d="M4 13.5V16h2.5l7.4-7.4-2.5-2.5L4 13.5zm8.2-7.3l2.5 2.5 1.1-1.1a1 1 0 000-1.4l-1.1-1.1a1 1 0 00-1.4 0l-1.1 1.1z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></Icon>;
}

export function MoreVerticalIcon(props: IconProps) {
    return <Icon {...props}><circle cx="10" cy="4" r="1" fill="currentColor" /><circle cx="10" cy="10" r="1" fill="currentColor" /><circle cx="10" cy="16" r="1" fill="currentColor" /></Icon>;
}