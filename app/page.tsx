export default async function RedirectHome() {
  return (
      <script>
        {`window.location.href = '/home';`}
      </script>
  );
}
