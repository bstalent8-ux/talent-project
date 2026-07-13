import QuestionClient from "./_components/QuestionClient";

export default function QuestionPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="grow">
        <QuestionClient />
      </main>
    </div>
  );
}
