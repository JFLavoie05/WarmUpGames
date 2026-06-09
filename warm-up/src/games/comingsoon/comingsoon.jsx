
const BASE = import.meta.env.BASE_URL

const IMAGES = [
    `${BASE}kappa fat chungus.png`,
    `${BASE}fat kappa 2.png`,
    `${BASE}fat kappa chungus 3.png`,
    `${BASE}kappa fat chungus.png`,
    `${BASE}fat kappa 2.png`,
    `${BASE}fat kappa chungus 3.png`,
    `${BASE}kappa fat chungus.png`,
    `${BASE}fat kappa 2.png`,
    `${BASE}fat kappa chungus 3.png`,
    `${BASE}kappa fat chungus.png`,
    `${BASE}fat kappa 2.png`,
    `${BASE}fat kappa chungus 3.png`,
    `${BASE}kappa fat chungus.png`,
    `${BASE}fat kappa 2.png`,
    `${BASE}fat kappa chungus 3.png`,
]

export default function ComingSoon() {
    return (
        <div style={{ minHeight: 'calc(100vh - 56px)', marginTop: '56px', background: '#0d0d1a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '40px', fontFamily: 'Segoe UI, sans-serif' }}>
            <h1 style={{ fontSize: '48px', fontWeight: '800', color: '#fff', letterSpacing: '4px', textTransform: 'uppercase', margin: 0 }}>Coming Soon</h1>
            <p style={{ fontSize: '15px', color: '#aaa', margin: 0 }}>More games will be added in the future, stay tuned !</p>
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', justifyContent: 'center' }}>
                {IMAGES.map((src, i) => (
                    <img key={i} src={src} alt="" style={{ height: '200px', borderRadius: '12px', border: '1px solid #1e1e3a' }} />
                ))}
            </div>
        </div>
    )
}