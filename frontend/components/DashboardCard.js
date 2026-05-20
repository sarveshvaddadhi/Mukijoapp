export default function DashboardCard({
    title,
    value,
    color,
}) {
    return (
        <div className={`${color} p-6 rounded-2xl shadow-md`}>

            <h2 className="text-xl font-semibold">
                {title}
            </h2>

            <p className="text-4xl font-bold mt-4">
                {value}
            </p>

        </div>
    );
}