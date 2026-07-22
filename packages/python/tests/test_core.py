import tempfile
import unittest
from pathlib import Path

from haif.core import create_record, init_records, load_records, preflight, validate_records


class HaifCoreTests(unittest.TestCase):
    def test_create_validate_and_preflight(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            init_records(root)
            create_record("proposal", "Improve shared intent", root)
            records = load_records(root)

            self.assertEqual(len(records), 1)
            self.assertEqual(validate_records(records), [])
            self.assertIn("No approved decision found for this scope.", preflight(records))


if __name__ == "__main__":
    unittest.main()
